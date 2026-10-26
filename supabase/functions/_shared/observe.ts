import { serviceClient } from './auth.ts';
import { json } from './http.ts';

/* Operational records read by system_health() and the admin "System health"
   screen: every scheduled job run, and every webhook received. */

type Db = ReturnType<typeof serviceClient>;

/** Runs a scheduled job and records ok / failed with its result or error. */
export async function runJob<T>(db: Db, job: string, fn: () => Promise<T>): Promise<Response> {
  const started = new Date().toISOString();
  try {
    const result = await fn();
    await db.rpc('record_job', { p_job: job, p_status: 'ok', p_details: (result ?? {}) as Record<string, unknown>, p_error: null, p_started: started });
    return json(result ?? { ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db.rpc('record_job', { p_job: job, p_status: 'failed', p_details: {}, p_error: message, p_started: started });
    return json({ error: message }, 500);
  }
}

/** Wraps a webhook handler: drops events already processed successfully,
    and logs every delivery with its outcome. `idOf` extracts a stable event
    id from the raw body ('' when the source has none). */
export function observeWebhook(source: string, idOf: (body: Record<string, unknown>) => string,
                               handle: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const raw = await req.text();
    let eventId = '';
    try { eventId = idOf(JSON.parse(raw) ?? {}).slice(0, 200); } catch { eventId = ''; }
    const db = serviceClient();
    if (eventId) {
      const { data: seen } = await db.from('webhook_events').select('id').eq('source', source).eq('event_id', eventId).eq('status', 'ok').limit(1);
      if (seen?.length) {
        await db.from('webhook_events').insert({ source, event_id: eventId, status: 'duplicate', http_status: 200 });
        return json({ ok: true, duplicate: true });
      }
    }
    let res: Response;
    let error: string | null = null;
    try {
      res = await handle(new Request(req.url, { method: req.method, headers: req.headers, body: raw || undefined }));
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      res = json({ error: 'internal error' }, 500);
    }
    const body = await res.clone().json().catch(() => ({})) as Record<string, unknown>;
    const status = res.ok ? (body.duplicate ? 'duplicate' : 'ok') : [401, 403].includes(res.status) ? 'rejected' : 'failed';
    await db.from('webhook_events').insert({
      source, event_id: eventId || null, status, http_status: res.status,
      error: error ?? (res.ok ? null : String(body.error ?? '').slice(0, 500)),
    });
    return res;
  };
}
