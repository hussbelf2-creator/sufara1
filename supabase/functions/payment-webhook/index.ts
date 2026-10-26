import { json, safeEqual } from '../_shared/http.ts';
import { serviceClient } from '../_shared/auth.ts';
import { observeWebhook } from '../_shared/observe.ts';

/* Moyasar webhook (payment_paid / payment_refunded / payment_failed).

   - Authenticity: the shared secret configured in the Moyasar dashboard is
     compared in constant time, then the payment is re-fetched from the
     Moyasar API so the amount and status come from the provider, not from
     the request body.
   - Idempotent: confirm_payment() ignores an order that is already paid.
   - Money: capture, escrow, reserve and commission rows are written in one
     database transaction by confirm_payment(); the tax invoice number is
     issued by issue_invoice() right after.

   Note on "holding" funds: card authorisations expire within days, so the
   30–60 day export return window cannot be held on the card. The money is
   captured and held in the customer-escrow ledger account; the factory and
   the ambassador are paid only after run_commission_engine() releases it. */

async function handle(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  const secret = Deno.env.get('MOYASAR_WEBHOOK_SECRET') ?? '';
  const apiKey = Deno.env.get('MOYASAR_SECRET_KEY') ?? '';
  if (!secret || !apiKey) return json({ error: 'not configured' }, 503);

  const event = await req.json().catch(() => null);
  if (!event || typeof event.secret_token !== 'string' || !safeEqual(event.secret_token, secret)) {
    return json({ error: 'unauthorized' }, 401);
  }

  const paymentId = String(event.data?.id ?? '');
  if (!paymentId) return json({ error: 'no payment' }, 400);
  const res = await fetch(`https://api.moyasar.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Basic ${btoa(`${apiKey}:`)}` },
  });
  if (!res.ok) return json({ error: 'cannot verify payment' }, 502);
  const payment = await res.json();

  const db = serviceClient();
  const orderId = String(payment.metadata?.order_id ?? '');
  const { data: order } = orderId
    ? await db.from('orders').select('id, total, payment_ref, buyer_email, buyer_phone, buyer_name').eq('id', orderId).maybeSingle()
    : await db.from('orders').select('id, total, payment_ref, buyer_email, buyer_phone, buyer_name').eq('payment_ref', payment.invoice_id).maybeSingle();
  if (!order) return json({ error: 'unknown order' }, 404);

  if (payment.status === 'paid') {
    if (payment.currency !== 'SAR' || Number(payment.amount) !== Math.round(Number(order.total) * 100)) {
      await db.from('audit_log').insert({ action: 'payment.mismatch', entity: 'orders', entity_id: order.id, details: { payment: payment.id, amount: payment.amount } });
      return json({ error: 'amount mismatch' }, 409);
    }
    const fee = payment.fee != null ? Number(payment.fee) / 100 : null;
    const { data: result, error } = await db.rpc('confirm_payment', { p_order_id: order.id, p_fee: fee, p_provider_ref: payment.id });
    if (error) return json({ error: error.message }, 500);
    if (result === 'paid') {
      /* The invoice is issued by the orders trigger; issuing it here is a no-op
         safety net. The buyer's confirmation (in-app, e-mail, WhatsApp with
         consent) comes from the invoices trigger through notify-dispatch. */
      await db.rpc('issue_invoice', { p_order_id: order.id });
    }
    return json({ ok: true, result });
  }

  if (payment.status === 'refunded') {
    const { error } = await db.rpc('refund_order', { p_order_id: order.id });
    if (error) return json({ error: error.message }, 409);
    return json({ ok: true });
  }

  await db.from('audit_log').insert({ action: `payment.${payment.status}`, entity: 'orders', entity_id: order.id, details: { payment: payment.id } });
  return json({ ok: true });
}

/* Moyasar re-sends events; one processed successfully is acknowledged and skipped. */
Deno.serve(observeWebhook('moyasar', (b) => {
  const data = (b.data ?? {}) as Record<string, unknown>;
  return String(b.id ?? (data.id ? `${data.id}:${b.type ?? data.status ?? ''}` : ''));
}, handle));
