import { corsHeaders, json, preflight } from '../_shared/http.ts';
import { requireAdmin, serviceClient } from '../_shared/auth.ts';
import { normalizeConfig, zoneIdOf } from '../_shared/platform.ts';
import { ManualModeError, shippingDriver, type Rate } from '../_shared/shipping-provider.ts';

/* Warehouse ↔ shipping aggregator (admin only).
   POST { action: 'status' }                              → which driver is active
   POST { action: 'rates', warehouse, country, weightKg }  → carrier quotes
   POST { action: 'label', shipment }                      → book + label + tracking no.
   POST { action: 'track', shipment }                      → pull events now          */

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const cors = corsHeaders(req);
  const auth = await requireAdmin(req);
  if ('error' in auth) return json({ error: auth.error }, auth.status, cors);

  const db = serviceClient();
  const driver = shippingDriver();
  const body = await req.json().catch(() => ({}));

  try {
    if (body.action === 'status') return json({ driver: driver.name, live: driver.live }, 200, cors);

    if (body.action === 'rates') {
      const { data: settings } = await db.rpc('active_settings');
      const cfg = normalizeConfig(settings ?? {});
      const { data: wh } = await db.from('warehouses').select('country, city').eq('id', body.warehouse).maybeSingle();
      const weight = Math.max(0.5, Number(body.weightKg) || 0.5);
      const tariff = (): Rate[] => {
        const zone = cfg.shipping.express[zoneIdOf(cfg, String(body.country))] ?? cfg.shipping.express.southAsia;
        return [{ carrier: 'tariff', service: 'express', amount: Math.round(zone.base + Math.ceil(weight * 2) / 2 * zone.perKg), etaDays: zone.etaDays, source: 'tariff' }];
      };
      const rates = await driver.rates({
        originCountry: wh?.country ?? 'sa', originCity: wh?.city ?? '', destinationCountry: String(body.country),
        weightKg: weight, parcels: Number(body.parcels) || 1,
      }, tariff);
      return json({ driver: driver.name, rates }, 200, cors);
    }

    const { data: sh } = await db.from('shipments').select('*').eq('id', body.shipment).maybeSingle();
    if (!sh) return json({ error: 'unknown shipment' }, 404, cors);

    if (body.action === 'label') {
      const { data: wh } = await db.from('warehouses').select('*').eq('id', sh.warehouse_id).single();
      const { data: items } = await db.from('shipment_items')
        .select('sub_order_id, sub_orders(goods, order_id, orders(buyer_name, buyer_phone, buyer_email, city, country, address, incoterm), order_items(qty, products(name_en, hs_code, weight_kg)))')
        .eq('shipment_id', sh.id);
      /* Embedded selects come back as nested objects (many-to-one). */
      type ItemRow = {
        sub_order_id: string;
        sub_orders: {
          goods: number; order_id: string;
          orders: { buyer_name: string; buyer_phone: string | null; buyer_email: string; city: string | null; country: string; address: string | null; incoterm: string };
          order_items: { qty: number; products: { name_en: string; hs_code: string | null; weight_kg: number } }[];
        };
      };
      const rows = (items ?? []) as unknown as ItemRow[];
      const first = rows[0]?.sub_orders?.orders;
      const parcels = rows.map((it) => ({
        weightKg: (it.sub_orders?.order_items ?? []).reduce((sum, x) => sum + x.qty * Number(x.products?.weight_kg ?? 0.5), 0) || 0.5,
        description: (it.sub_orders?.order_items ?? []).map((x) => x.products?.name_en).join(', ').slice(0, 200),
        valueSar: Number(it.sub_orders?.goods ?? 0),
        hsCode: it.sub_orders?.order_items?.[0]?.products?.hs_code ?? undefined,
      }));
      /* The warehouse's scale weight wins over catalogue weights: spread it
         across the parcels in proportion, since the aggregator prices by it. */
      const measured = Number(body.weightKg) > 0 ? Number(body.weightKg) : 0;
      const catalogue = parcels.reduce((sum, p) => sum + p.weightKg, 0);
      if (measured && catalogue) parcels.forEach((p) => { p.weightKg = Math.round((p.weightKg / catalogue) * measured * 100) / 100; });
      const label = await driver.createLabel({
        reference: sh.id, carrier: sh.carrier_code, service: sh.service,
        from: { name: 'Safeer', city: wh.city, country: wh.country, address: wh.address, phone: wh.contact_phone ?? undefined },
        to: { name: first?.buyer_name ?? '', city: first?.city ?? '', country: sh.destination_country, address: first?.address ?? '', phone: first?.buyer_phone ?? undefined, email: first?.buyer_email ?? undefined },
        parcels,
        incoterm: first?.incoterm ?? 'DDP',
      });
      const { error } = await db.rpc('shipment_label', {
        p_shipment: sh.id, p_tracking: label.trackingNo, p_label_url: label.labelUrl, p_provider_ref: label.providerRef, p_cost: label.cost,
      });
      if (error) return json({ error: error.message }, 409, cors);
      return json({ ok: true, ...label }, 200, cors);
    }

    if (body.action === 'track') {
      if (!sh.provider_ref) return json({ error: 'no provider reference (manual shipment)' }, 409, cors);
      const { data: seen } = await db.from('shipment_events').select('status, occurred_at').eq('shipment_id', sh.id);
      const known = new Set((seen ?? []).map((e) => `${e.status}|${new Date(e.occurred_at).toISOString()}`));
      let added = 0;
      for (const ev of await driver.track(sh.provider_ref)) {
        if (known.has(`${ev.status}|${new Date(ev.at).toISOString()}`)) continue;
        const { error } = await db.rpc('record_shipment_event', {
          p_shipment: sh.id, p_status: ev.status, p_at: ev.at, p_description: ev.description ?? null, p_location: ev.location ?? null, p_raw: ev.raw ?? null,
        });
        if (!error) added += 1;
      }
      return json({ ok: true, added }, 200, cors);
    }
    return json({ error: 'unknown action' }, 400, cors);
  } catch (err) {
    if (err instanceof ManualModeError) return json({ error: err.message, manual: true }, 409, cors);
    return json({ error: err instanceof Error ? err.message : 'shipping failed' }, 502, cors);
  }
});
