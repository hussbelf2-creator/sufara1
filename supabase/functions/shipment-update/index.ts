import { hmacSha256Hex, json, safeEqual } from '../_shared/http.ts';
import { serviceClient } from '../_shared/auth.ts';
import { observeWebhook } from '../_shared/observe.ts';
import { mapCarrierStatus } from '../_shared/shipping-provider.ts';

/* Tracking webhook from the shipping aggregator.

   Authentication — whichever the aggregator supports:
     • SHIPPING_WEBHOOK_HMAC_SECRET set → header x-signature must be the hex
       HMAC-SHA256 of the raw body (an optional "sha256=" prefix is accepted);
     • otherwise header x-carrier-secret must equal SHIPPING_WEBHOOK_SECRET.
   Re-sent events (same shipment, status and time) are acknowledged and ignored.

   Body (shipment level — the normal case after integration):
     { tracking_no, status: in_transit|out_for_delivery|delivered|exception|returned,
       at?, description?, location? }
   Body (sub-order level — kept for manual tools):
     { sub_order_id, status: dispatched|delivered|returned, at?, tracking_no? }

   A carrier-confirmed "delivered" starts the destination return window, the
   clock that unlocks commissions and the factory settlement. */

async function handle(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  const raw = await req.text();
  const hmacSecret = Deno.env.get('SHIPPING_WEBHOOK_HMAC_SECRET') ?? '';
  if (hmacSecret) {
    const given = (req.headers.get('x-signature') ?? '').replace(/^sha256=/, '').toLowerCase();
    if (!safeEqual(given, await hmacSha256Hex(hmacSecret, raw))) return json({ error: 'unauthorized' }, 401);
  } else {
    const secret = Deno.env.get('SHIPPING_WEBHOOK_SECRET') ?? Deno.env.get('CARRIER_WEBHOOK_SECRET') ?? '';
    if (!secret || !safeEqual(req.headers.get('x-carrier-secret') ?? '', secret)) return json({ error: 'unauthorized' }, 401);
  }

  let body: Record<string, unknown> | null = null;
  try { body = JSON.parse(raw); } catch { body = null; }
  if (!body) return json({ error: 'bad event' }, 400);
  const db = serviceClient();
  const at = body.at ? new Date(String(body.at)).toISOString() : new Date().toISOString();

  if (body.tracking_no && !body.sub_order_id) {
    const { data: sh } = await db.from('shipments').select('id').eq('tracking_no', String(body.tracking_no)).maybeSingle();
    if (!sh) return json({ error: 'unknown tracking number' }, 404);
    const mapped = mapCarrierStatus(String(body.status ?? ''));
    if (!mapped) return json({ ok: true, ignored: String(body.status ?? '') });   // informational scan, not a state change
    const { data: dup } = await db.from('shipment_events').select('id').eq('shipment_id', sh.id)
      .eq('status', mapped).eq('occurred_at', at).limit(1);
    if (dup?.length) return json({ ok: true, duplicate: true });
    const { error } = await db.rpc('record_shipment_event', {
      p_shipment: sh.id, p_status: mapped, p_at: at,
      p_description: body.description ? String(body.description).slice(0, 300) : null,
      p_location: body.location ? String(body.location).slice(0, 120) : null, p_raw: body,
    });
    if (error) return json({ error: error.message }, 409);
    /* Buyer notices (in-app, e-mail, WhatsApp with consent) come from the
       shipments trigger and notify-dispatch — not from here. */
    return json({ ok: true });
  }

  const status = String(body.status ?? '');
  if (!body.sub_order_id || !['dispatched', 'delivered', 'returned'].includes(status)) return json({ error: 'bad event' }, 400);
  const { error } = await db.rpc('record_shipment', {
    p_sub_order: String(body.sub_order_id), p_status: status, p_at: at, p_tracking: body.tracking_no ? String(body.tracking_no) : null,
  });
  if (error) return json({ error: error.message }, 409);
  return json({ ok: true });
}

Deno.serve(observeWebhook('shipping', (b) => [b.tracking_no ?? b.sub_order_id, b.status, b.at].filter(Boolean).join(':'), handle));
