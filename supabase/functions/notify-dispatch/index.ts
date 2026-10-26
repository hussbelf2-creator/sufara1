import { json, safeEqual } from '../_shared/http.ts';
import { serviceClient } from '../_shared/auth.ts';
import { sendEmail, sendWhatsApp } from '../_shared/notify.ts';
import { runJob } from '../_shared/observe.ts';

/* Every few minutes (cron, x-cron-secret):
   • e-mails the notifications not e-mailed yet — account holders at their
     auth e-mail, guests at the e-mail on their order, admin notifications to
     ADMIN_EMAILS;
   • sends WhatsApp for kinds that have an active (Meta-approved) template in
     whatsapp_templates, only to numbers that opted in (profile or checkout). */

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

Deno.serve(async (req) => {
  const secret = Deno.env.get('CRON_SECRET') ?? '';
  if (!secret || !safeEqual(req.headers.get('x-cron-secret') ?? '', secret)) return json({ error: 'unauthorized' }, 401);
  const db = serviceClient();
  return runJob(db, 'notify_dispatch', () => dispatch(db));
});

async function dispatch(db: ReturnType<typeof serviceClient>) {
  const site = Deno.env.get('SITE_URL') ?? '';
  const admins = (Deno.env.get('ADMIN_EMAILS') ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  const { data: rows } = await db.from('notifications').select('*').is('emailed_at', null)
    .gte('created_at', new Date(Date.now() - 3 * 86400_000).toISOString()).order('id').limit(200);
  let sent = 0;
  for (const n of rows ?? []) {
    let to: string[] = [];
    if (n.audience === 'admins') to = admins;
    else if (n.email) to = [n.email];
    else if (n.user_id) {
      const { data } = await db.auth.admin.getUserById(n.user_id);
      if (data?.user?.email) to = [data.user.email];
    }
    const html = `<div dir="rtl" style="font-family:Tahoma,Arial"><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p>${n.link ? `<p><a href="${site}${n.link}">فتح في سفير</a></p>` : ''}</div>`;
    for (const addr of to) await sendEmail(addr, `سفير · ${n.title}`, html);
    await db.from('notifications').update({ emailed_at: new Date().toISOString() }).eq('id', n.id);
    sent += to.length;
  }

  /* WhatsApp: separate pass, so an e-mail outage never blocks it and vice versa. */
  const { data: templates } = await db.from('whatsapp_templates').select('*').eq('active', true);
  const byKind = new Map((templates ?? []).map((t) => [t.kind as string, t]));
  let whatsapp = 0;
  if (byKind.size) {
    const { data: pending } = await db.from('notifications').select('*').is('whatsapp_at', null).eq('audience', 'user')
      .in('kind', [...byKind.keys()]).gte('created_at', new Date(Date.now() - 2 * 86400_000).toISOString()).order('id').limit(200);
    for (const n of pending ?? []) {
      const t = byKind.get(n.kind)!;
      const data = (n.data ?? {}) as Record<string, unknown>;
      let status = 'no_consent';
      if (data.whatsapp === true && typeof data.phone === 'string') {
        const params = (t.params as string[]).map((p) => {
          if (p === 'title') return n.title;
          if (p === 'body') return n.body;
          if (p === 'link') return n.link ? `${site}${n.link}` : site;
          return p.startsWith('data.') ? String(data[p.slice(5)] ?? '') : '';
        });
        status = await sendWhatsApp(data.phone, t.template_name, params, t.lang);
        if (status === 'sent') whatsapp += 1;
      }
      await db.from('notifications').update({ whatsapp_at: new Date().toISOString(), whatsapp_status: status }).eq('id', n.id);
    }
  }
  return { processed: rows?.length ?? 0, sent, whatsapp };
}
