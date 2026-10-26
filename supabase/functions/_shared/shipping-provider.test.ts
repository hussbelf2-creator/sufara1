/* End-to-end check of the aggregator driver against a local mock aggregator:
   rates, label (idempotent), tracking with status mapping, retries on 5xx,
   no retry on 4xx, timeout. Run: deno test --allow-net --allow-env */
import { httpDriver, mapCarrierStatus, shippingDriver } from './shipping-provider.ts';

const assert = (cond: unknown, msg: string) => { if (!cond) throw new Error(msg); };

function mockAggregator() {
  const seen = { labels: new Map<string, number>(), rateCalls: 0, auth: '' };
  const server = Deno.serve({ port: 0, onListen: () => {} }, async (req) => {
    const url = new URL(req.url);
    seen.auth = req.headers.get('authorization') ?? '';
    if (url.pathname === '/rates') {
      seen.rateCalls += 1;
      if (seen.rateCalls === 1) return new Response('{"message":"busy"}', { status: 503 });   // first call fails → retried
      return Response.json({ rates: [{ carrier: 'aramex', service: 'economy', amount: 142.5, min_days: 4, max_days: 7 }] });
    }
    if (url.pathname === '/shipments' && req.method === 'POST') {
      const key = req.headers.get('idempotency-key') ?? '';
      const body = await req.json();
      if (!body.parcels?.length) return Response.json({ message: 'parcels required' }, { status: 422 });
      seen.labels.set(key, (seen.labels.get(key) ?? 0) + 1);
      return Response.json({ id: `agg-${key}`, tracking_number: `AX${key.slice(0, 6)}`, label_url: 'https://agg.test/l.pdf', cost: 98 });
    }
    if (url.pathname.startsWith('/shipments/') && url.pathname.endsWith('/events')) {
      return Response.json({ events: [
        { status: 'Picked Up', timestamp: '2026-10-20T08:00:00Z', location: 'Jeddah' },
        { status: 'scan', timestamp: '2026-10-20T09:00:00Z' },                       // informational → dropped
        { status: 'Out-For-Delivery', timestamp: '2026-10-24T07:00:00Z', location: 'Jakarta' },
        { status: 'DELIVERED', timestamp: '2026-10-24T12:00:00Z', location: 'Jakarta' },
      ] });
    }
    if (url.pathname === '/slow') { await new Promise((r) => setTimeout(r, 500)); return Response.json({}); }
    return new Response('not found', { status: 404 });
  });
  return { server, seen, base: `http://localhost:${(server.addr as Deno.NetAddr).port}` };
}

const label = {
  reference: '3f2a9c10-0000-4000-8000-000000000001', carrier: 'aramex', service: 'economy',
  from: { name: 'Safeer', city: 'Jeddah', country: 'sa', address: 'Warehouse 14' },
  to: { name: 'Pilgrim', city: 'Jakarta', country: 'id', address: 'Jl. Merdeka 1' },
  parcels: [{ weightKg: 2.2, description: 'Dates', valueSar: 178, hsCode: '0804.10' }],
  incoterm: 'DDP',
};

Deno.test('http driver: rates retried on 5xx, label idempotent, tracking mapped', async () => {
  const { server, seen, base } = mockAggregator();
  try {
    const d = httpDriver(base, 'secret-key', { retries: 2 });
    const rates = await d.rates({ originCountry: 'sa', originCity: 'Jeddah', destinationCountry: 'id', weightKg: 2.2, parcels: 1 }, () => []);
    assert(seen.rateCalls === 2, 'rates retried once after 503');
    assert(rates[0].amount === 142.5 && rates[0].source === 'aggregator' && rates[0].etaDays[1] === 7, 'rate mapped');
    assert(seen.auth === 'Bearer secret-key', 'API key sent');

    const l1 = await d.createLabel(label);
    const l2 = await d.createLabel(label);
    assert(l1.trackingNo === l2.trackingNo && l1.providerRef === `agg-${label.reference}`, 'same shipment → same label');
    assert(seen.labels.get(label.reference) === 2, 'both calls carried the idempotency key');

    const events = await d.track(l1.providerRef);
    assert(events.map((e) => e.status).join(',') === 'in_transit,out_for_delivery,delivered', 'statuses mapped, scans dropped');
  } finally {
    await server.shutdown();
  }
});

Deno.test('http driver: 4xx is not retried and surfaces the message', async () => {
  const { server, base } = mockAggregator();
  try {
    const d = httpDriver(base, 'k');
    let msg = '';
    try { await d.createLabel({ ...label, parcels: [] }); } catch (e) { msg = (e as Error).message; }
    assert(msg === 'parcels required', 'aggregator message surfaced');
  } finally {
    await server.shutdown();
  }
});

Deno.test('http driver: timeout', async () => {
  const { server, base } = mockAggregator();
  try {
    const d = httpDriver(`${base}/slow#`, 'k', { timeoutMs: 100, retries: 0 });
    let failed = false;
    try { await d.track('x'); } catch { failed = true; }
    assert(failed, 'slow aggregator times out');
  } finally {
    await server.shutdown();
  }
});

Deno.test('driver selection and status words', () => {
  Deno.env.delete('SHIPPING_PROVIDER');
  assert(shippingDriver().name === 'manual' && !shippingDriver().live, 'manual by default');
  Deno.env.set('SHIPPING_PROVIDER', 'http');
  Deno.env.set('SHIPPING_API_URL', 'https://agg.test');
  Deno.env.set('SHIPPING_API_KEY', 'k');
  assert(shippingDriver().live, 'http when configured');
  assert(mapCarrierStatus('Return to Sender') === 'returned' && mapCarrierStatus('customs hold') === 'exception', 'status words');
  assert(mapCarrierStatus('label printed') === null, 'unknown words ignored');
});
