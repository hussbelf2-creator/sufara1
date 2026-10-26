import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json, preflight } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/auth.ts';

/* Uploads a CMS media file (video or image) for the admin content panel.

   Hardening (audit §4):
   - Caller must present their own session token and hold the admin role
     (user_roles) — the anon key alone is refused.
   - CORS is limited to ALLOWED_ORIGINS.
   - Size limits come from env (defaults 8 MB image / 60 MB video), the MIME
     type is checked against the file's magic bytes, not only the header.
   - Each admin is rate-limited (UPLOADS_PER_HOUR, default 30).
   - The file lands in the public `media` bucket under cms/ and is returned
     as its public URL — no year-long signed links. Every upload is written
     to the audit log. */

const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const EXT: Record<string, string> = {
  'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif',
};

/* Minimal magic-byte sniffing so a renamed executable is refused. */
function sniff(bytes: Uint8Array): string | null {
  const at = (i: number, ...v: number[]) => v.every((b, k) => bytes[i + k] === b);
  if (at(0, 0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (at(0, 0x89, 0x50, 0x4e, 0x47)) return 'image/png';
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return 'image/webp';
  if (at(4, 0x66, 0x74, 0x79, 0x70)) {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (brand.startsWith('avif') || brand.startsWith('avis')) return 'image/avif';
    if (brand.startsWith('qt')) return 'video/quicktime';
    return 'video/mp4';
  }
  if (at(0, 0x1a, 0x45, 0xdf, 0xa3)) return 'video/webm';
  return null;
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const cors = corsHeaders(req);
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405, cors);

  const auth = await requireAdmin(req);
  if ('error' in auth) return json({ error: auth.error }, auth.status, cors);

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

  try {
    const perHour = Number(Deno.env.get('UPLOADS_PER_HOUR') ?? '30');
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await admin
      .from('audit_log')
      .select('id', { count: 'exact', head: true })
      .eq('actor_id', auth.userId)
      .eq('action', 'cms.upload')
      .gte('created_at', since);
    if ((count ?? 0) >= perHour) return json({ error: 'rate limited' }, 429, cors);

    const form = await req.formData();
    const file = form.get('file');
    const kind = String(form.get('kind') || 'video') === 'image' ? 'image' : 'video';
    if (!(file instanceof File)) return json({ error: 'file is required' }, 400, cors);

    const mb = kind === 'video' ? Number(Deno.env.get('MAX_VIDEO_MB') ?? '60') : Number(Deno.env.get('MAX_IMAGE_MB') ?? '8');
    if (file.size === 0) return json({ error: 'file is empty' }, 400, cors);
    if (file.size > mb * 1024 * 1024) return json({ error: 'file is too large' }, 413, cors);

    const allowed = kind === 'video' ? VIDEO_TYPES : IMAGE_TYPES;
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const real = sniff(head);
    if (!real || !allowed.includes(real) || (file.type && file.type !== real && !(real === 'video/mp4' && file.type === 'video/quicktime'))) {
      return json({ error: 'unsupported file type' }, 415, cors);
    }

    const path = `cms/${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${EXT[real]}`;
    const { error: uploadError } = await admin.storage
      .from('media')
      .upload(path, file, { contentType: real, upsert: false, cacheControl: '86400' });
    if (uploadError) return json({ error: uploadError.message }, 400, cors);

    const { data } = admin.storage.from('media').getPublicUrl(path);
    await admin.from('audit_log').insert({
      actor_id: auth.userId,
      action: 'cms.upload',
      entity: 'storage.media',
      entity_id: path,
      details: { size: file.size, type: real, kind },
    });
    return json({ path, url: data.publicUrl }, 200, cors);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'upload failed' }, 500, cors);
  }
});
