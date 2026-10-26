import { corsHeaders, json, preflight, sha256 } from '../_shared/http.ts';
import { callerOf, serviceClient } from '../_shared/auth.ts';
import { priceOrder, PricingError, type ProductRow, type PromoRow, type ShipMethod } from '../_shared/pricing.ts';
import { normalizeConfig } from '../_shared/platform.ts';

/* Creates an order from ids and quantities only and opens the payment.

   Nothing the browser computed is trusted: prices, tiers, the discount cap,
   shipping, customs, VAT, the channel and the ambassador attribution are all
   recomputed here from the database and the active PlatformConfig version,
   whose number is stamped on the order. */

const METHODS: ShipMethod[] = ['express', 'group', 'sea', 'air'];

function orderId(): string {
  const d = new Date();
  const stamp = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  const rnd = crypto.getRandomValues(new Uint8Array(4));
  return `SFR-${stamp}-${Array.from(rnd).map((b) => b.toString(36).padStart(2, '0')).join('').toUpperCase().slice(0, 6)}`;
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const cors = corsHeaders(req);
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405, cors);

  const db = serviceClient();
  try {
    const body = await req.json();
    const caller = await callerOf(req);

    // ── input shape ────────────────────────────────────────────────────
    const lines = Array.isArray(body.lines) ? body.lines.slice(0, 60) : [];
    const method = String(body.method) as ShipMethod;
    const country = String(body.destination?.country ?? '').toLowerCase().slice(0, 2);
    const email = String(body.buyer?.email ?? '').trim().toLowerCase();
    if (!lines.length || !METHODS.includes(method) || !country || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: 'invalid order' }, 400, cors);
    }
    if (!['DDP', 'CIF', 'FOB'].includes(body.incoterm) || !['platform', 'buyer', 'agent'].includes(body.customsParty)) {
      return json({ error: 'delivery terms required' }, 400, cors);
    }

    // ── active settings ───────────────────────────────────────────────
    const { data: settingsRow } = await db.from('platform_settings').select('version, payload')
      .lte('effective_from', new Date().toISOString().slice(0, 10))
      .order('effective_from', { ascending: false }).order('version', { ascending: false }).limit(1).maybeSingle();
    const cfg = normalizeConfig(settingsRow?.payload ?? {});
    const settingsVersion = settingsRow?.version ?? cfg.version;

    // ── products from the database ────────────────────────────────────
    const ids = [...new Set(lines.map((l: { productId: string }) => String(l.productId)))];
    const { data: products, error: pErr } = await db.from('products')
      .select('id, factory_id, category_id, price, weight_kg, moq, tiers, active').in('id', ids);
    if (pErr) throw pErr;
    const byId = new Map((products as ProductRow[]).map((p) => [p.id, p]));
    const priced = lines.map((l: { productId: string; qty: number }) => {
      const product = byId.get(String(l.productId));
      if (!product) throw new PricingError(`unknown product ${l.productId}`);
      return { product: { ...product, price: Number(product.price), weight_kg: Number(product.weight_kg) }, qty: Number(l.qty) };
    });

    // ── customer + attribution ────────────────────────────────────────
    const emailHash = await sha256(email);
    let { data: customer } = await db.from('customers').select('id').eq('email_hash', emailHash).maybeSingle();
    if (!customer) {
      const ins = await db.from('customers').insert({ email_hash: emailHash, user_id: caller?.userId ?? null, country }).select('id').single();
      customer = ins.data;
    }

    const code = body.promoCode ? String(body.promoCode).trim().toUpperCase().slice(0, 40) : '';
    let promo: PromoRow | null = null;
    let ambassadorId: string | null = null;
    let referralCode: string | null = null;
    let clickId: string | null = null;
    let promoFromReferral = false;

    if (code) {
      const now = new Date().toISOString();
      const { data: pc } = await db.from('promo_codes').select('code, kind, value, min_subtotal, starts_at, ends_at, max_uses, used, active')
        .eq('code', code).maybeSingle();
      if (pc && pc.active && (!pc.starts_at || pc.starts_at <= now) && (!pc.ends_at || pc.ends_at >= now)
          && (pc.max_uses == null || pc.used < pc.max_uses)) {
        promo = { code: pc.code, kind: pc.kind, value: Number(pc.value), min_subtotal: Number(pc.min_subtotal) };
      } else {
        const { data: link } = await db.from('referral_links').select('code, ambassador_id, discount_pct, active').eq('code', code).maybeSingle();
        if (link?.active) {
          promo = { code: link.code, kind: 'percent', value: Math.min(Number(link.discount_pct), cfg.promo.ambassadorCodeRate * 100), min_subtotal: 0 };
          ambassadorId = link.ambassador_id;
          referralCode = link.code;
          promoFromReferral = true;
        }
      }
    }

    // A click inside the attribution window attributes when no code did.
    if (body.clickId && typeof body.clickId === 'string') {
      const since = new Date(Date.now() - cfg.ambassador.attributionDays * 86400_000).toISOString();
      const { data: click } = await db.from('clicks').select('id, ambassador_id, code').eq('id', body.clickId).gte('created_at', since).maybeSingle();
      if (click) {
        clickId = click.id;
        if (!ambassadorId) {
          ambassadorId = click.ambassador_id;
          referralCode = click.code ?? null;
        }
      }
    }

    // No self-referral: the ambassador cannot be the buyer.
    if (ambassadorId) {
      const { data: ambUser } = await db.auth.admin.getUserById(ambassadorId);
      const ambEmail = ambUser?.user?.email?.toLowerCase() ?? '';
      const { data: amb } = await db.from('ambassadors').select('status').eq('user_id', ambassadorId).maybeSingle();
      if (ambEmail === email || caller?.userId === ambassadorId || amb?.status !== 'active') {
        ambassadorId = null;
        referralCode = null;
        if (promoFromReferral) promo = null;
      }
    }

    // ── group parcel: only inside a real, open group for this country ──
    let groupOrderId: string | null = null;
    let participants = 0;
    if (method === 'group') {
      const { data: group } = await db.rpc('resolve_group', { p_code: String(body.groupCode ?? '') });
      const g = group as { id: string; country: string; participants: number; min: number } | null;
      if (!g || g.country !== country) return json({ error: 'group order code is missing, closed or for another country' }, 422, cors);
      groupOrderId = g.id;
      /* The parcel ships only once the minimum joins, so each buyer pays the
         handling fee divided by the larger of the minimum and the real
         head-count: the first `min` buyers cover the fee in full. */
      participants = Math.max(g.min, g.participants + 1);
    }

    // ── price ─────────────────────────────────────────────────────────
    const order = priceOrder(cfg, { lines: priced, countryCode: country, method, promo, participants });
    const id = orderId();

    /* The buyer accepts the terms and privacy policy in force by placing the order. */
    const { data: docs } = await db.from('legal_documents').select('key, version, effective_from')
      .in('key', ['terms', 'privacy']).lte('effective_from', new Date().toISOString().slice(0, 10))
      .order('effective_from', { ascending: false });
    const versionOf = (k: string) => (docs ?? []).find((d) => d.key === k)?.version ?? null;

    const { error: oErr } = await db.from('orders').insert({
      id, customer_id: customer!.id, buyer_user_id: caller?.userId ?? null, channel: order.channel,
      buyer_name: String(body.buyer?.name ?? '').slice(0, 120), buyer_email: email,
      buyer_phone: String(body.buyer?.phone ?? '').slice(0, 40) || null,
      whatsapp_opt_in: body.buyer?.whatsapp === true && Boolean(body.buyer?.phone),
      terms_version: versionOf('terms'), privacy_version: versionOf('privacy'),
      buyer_company: String(body.buyer?.company ?? '').slice(0, 160) || null,
      buyer_vat_no: String(body.buyer?.vatNo ?? '').slice(0, 20) || null,
      country, city: String(body.destination?.city ?? '').slice(0, 80), port: String(body.destination?.port ?? '').slice(0, 120),
      address: String(body.destination?.address ?? '').slice(0, 300),
      incoterm: body.incoterm, customs_party: body.customsParty, ship_method: method,
      goods: order.goods, discount: order.discount, shipping: order.shipping, customs: order.customs, vat: order.vat, total: order.total,
      display_currency: String(body.displayCurrency ?? 'SAR').slice(0, 3), promo_code: promo?.code ?? null,
      referral_code: referralCode, click_id: clickId, ambassador_id: ambassadorId,
      settings_version: settingsVersion, return_days: order.returnDays, group_order_id: groupOrderId,
    });
    if (oErr) throw oErr;

    for (const [i, s] of order.subOrders.entries()) {
      const { data: known } = await db.from('factory_customers').select('email_hash')
        .eq('factory_id', s.factoryId).eq('email_hash', emailHash).maybeSingle();
      const subId = `${id}-${i + 1}`;
      const { error: sErr } = await db.from('sub_orders').insert({
        id: subId, order_id: id, factory_id: s.factoryId, goods: s.goods, discount: s.discount,
        take_rate: s.takeRate, take: s.take, new_customer: !known,
      });
      if (sErr) throw sErr;
      const { error: iErr } = await db.from('order_items').insert(s.items.map((it) => ({
        sub_order_id: subId, product_id: it.productId, qty: it.qty, unit_price: it.unit, line_total: it.total,
      })));
      if (iErr) throw iErr;
    }

    // ── payment (Moyasar: mada, Apple Pay, Visa/Mastercard) ───────────
    const secret = Deno.env.get('MOYASAR_SECRET_KEY');
    /* No gateway yet: the order stands as "awaiting bank transfer" and
       finance confirms it from the admin orders screen. */
    if (!secret) return json({ order_id: id, payment_url: null, mode: 'transfer', total: order.total }, 200, cors);
    const res = await fetch('https://api.moyasar.com/v1/invoices', {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa(`${secret}:`)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: Math.round(order.total * 100),
        currency: 'SAR',
        description: `Safeer order ${id}`,
        success_url: String(body.successUrl ?? ''),
        back_url: String(body.cancelUrl ?? ''),
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`,
        metadata: { order_id: id },
      }),
    });
    const inv = await res.json();
    if (!res.ok || !inv.url) return json({ order_id: id, error: 'payment provider error' }, 502, cors);
    await db.from('orders').update({ payment_ref: inv.id }).eq('id', id);
    return json({ order_id: id, payment_url: inv.url }, 200, cors);
  } catch (err) {
    if (err instanceof PricingError) return json({ error: err.message }, 422, cors);
    console.error(err);
    return json({ error: 'order failed' }, 500, cors);
  }
});
