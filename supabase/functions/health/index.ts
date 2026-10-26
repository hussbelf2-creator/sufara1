import { json, safeEqual } from '../_shared/http.ts';
import { serviceClient } from '../_shared/auth.ts';
import { sendEmail } from '../_shared/notify.ts';

/* Health endpoint.

   GET  (public, for an external uptime monitor — UptimeRobot, Better Stack…)
        → 200 { status: "ok" | "warn" } or 503 { status: "fail" | "down" }.
        No details are exposed; the database being unreachable reads "down".
   POST (cron every 15 minutes, header x-cron-secret)
        → health_sweep(): compares every check with its last state and, on a
          change only, alerts the admins in the dashboard AND by e-mail right
          away (not through notify-dispatch, which may be the broken part). */

Deno.serve(async (req) => {
  const db = serviceClient();

  if (req.method === 'GET') {
    const { data, error } = await db.rpc('system_health');
    if (error || !data) return json({ status: 'down' }, 503);
    const overall = String((data as { overall: string }).overall);
    return json({ status: overall, checked_at: (data as { checked_at: string }).checked_at }, overall === 'fail' ? 503 : 200);
  }

  const secret = Deno.env.get('CRON_SECRET') ?? '';
  if (!secret || !safeEqual(req.headers.get('x-cron-secret') ?? '', secret)) return json({ error: 'unauthorized' }, 401);
  const { data, error } = await db.rpc('health_sweep');
  if (error) return json({ error: error.message }, 500);
  const sweep = data as { overall: string; changed: { key: string; from: string | null; to: string; value: unknown }[] };

  if (sweep.changed.length) {
    const admins = (Deno.env.get('ADMIN_EMAILS') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const site = Deno.env.get('SITE_URL') ?? '';
    const rows = sweep.changed.map((c) => `<li><b>${c.key}</b>: ${c.from ?? '—'} → <b>${c.to}</b> (${String(c.value ?? '—')})</li>`).join('');
    const html = `<div dir="rtl" style="font-family:Tahoma,Arial"><h3>سفير · حالة التشغيل: ${sweep.overall}</h3><ul>${rows}</ul>`
      + `<p><a href="${site}/dashboard?mode=admin&view=admin-health">فتح صحة النظام</a></p></div>`;
    for (const to of admins) await sendEmail(to, `سفير · تنبيه تشغيل (${sweep.overall})`, html);
  }
  return json(sweep);
});
