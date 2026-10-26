import { corsHeaders, json, preflight, sha256 } from '../_shared/http.ts';
import { serviceClient } from '../_shared/auth.ts';

/* Records a visit to an ambassador page and returns an opaque click id.
   The click id — not a typed code — is what proves the visit when the order
   is created. Abuse controls: IP and user agent are stored only as salted
   hashes, and one IP may record at most CLICKS_PER_IP_HOUR clicks an hour. */

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const cors = corsHeaders(req);
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405, cors);

  try {
    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug ?? '').slice(0, 80);
    const factoryId = String(body.factory_id ?? '').slice(0, 40) || null;
    const code = body.code ? String(body.code).toUpperCase().slice(0, 40) : null;
    if (!slug) return json({ error: 'slug required' }, 400, cors);

    const db = serviceClient();
    const { data: amb } = await db.from('ambassadors').select('user_id, status').eq('slug', slug).maybeSingle();
    if (!amb || amb.status !== 'active') return json({ click_id: null }, 200, cors);

    const salt = Deno.env.get('CLICK_SALT') ?? '';
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
    const ipHash = await sha256(`${salt}|${ip}`);
    const uaHash = await sha256(`${salt}|${req.headers.get('user-agent') ?? ''}`);

    const limit = Number(Deno.env.get('CLICKS_PER_IP_HOUR') ?? '20');
    const { count } = await db.from('clicks').select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash).gte('created_at', new Date(Date.now() - 3600_000).toISOString());
    if ((count ?? 0) >= limit) return json({ click_id: null }, 200, cors);

    let validCode: string | null = null;
    if (code) {
      const { data: link } = await db.from('referral_links').select('code').eq('code', code)
        .eq('ambassador_id', amb.user_id).eq('active', true).maybeSingle();
      validCode = link?.code ?? null;
    }

    const { data, error } = await db.from('clicks').insert({
      code: validCode, ambassador_id: amb.user_id, factory_id: factoryId, ip_hash: ipHash, ua_hash: uaHash,
      referrer: body.referrer ? String(body.referrer).slice(0, 300) : null,
    }).select('id').single();
    if (error) return json({ click_id: null }, 200, cors);
    return json({ click_id: data.id }, 200, cors);
  } catch {
    return json({ click_id: null }, 200, cors);
  }
});
