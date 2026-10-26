/* Shipping-aggregator adapter.

   The platform talks to ONE aggregator (one contract, many carriers) through
   this neutral interface. Until the contract is signed the "manual" driver is
   used: rates come from the PlatformConfig lanes and the warehouse types the
   tracking number in. Signing the contract means writing one driver below —
   no screen, table or database function changes.

   Environment:
     SHIPPING_PROVIDER = manual | http
     SHIPPING_API_URL, SHIPPING_API_KEY      (http driver)
     SHIPPING_WEBHOOK_SECRET                 (shipment-update)              */

export interface RateRequest {
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  weightKg: number;
  parcels: number;
  service?: string;
}
export interface Rate {
  carrier: string;
  service: string;
  amount: number;          // SAR
  etaDays: [number, number];
  source: 'aggregator' | 'tariff';
}
export interface LabelRequest {
  reference: string;       // shipment id
  carrier: string;
  service: string;
  from: { name: string; city: string; country: string; address: string; phone?: string };
  to: { name: string; city: string; country: string; address: string; phone?: string; email?: string };
  parcels: { weightKg: number; description: string; valueSar: number; hsCode?: string }[];
  incoterm: string;
}
export interface Label {
  trackingNo: string;
  labelUrl: string;
  providerRef: string;
  cost: number;
}
export interface TrackingEvent {
  status: 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned';
  at: string;
  description?: string;
  location?: string;
  raw?: unknown;
}

export interface ShippingDriver {
  name: string;
  live: boolean;
  rates(req: RateRequest, tariff: () => Rate[]): Promise<Rate[]>;
  createLabel(req: LabelRequest): Promise<Label>;
  track(providerRef: string): Promise<TrackingEvent[]>;
}

export class ManualModeError extends Error {}

const manual: ShippingDriver = {
  name: 'manual',
  live: false,
  rates: async (_req, tariff) => tariff(),
  createLabel: async () => {
    throw new ManualModeError('manual mode: enter the carrier tracking number from the warehouse screen');
  },
  track: async () => [],
};

/* Generic JSON driver: maps the aggregator's API onto the interface. The
   paths and field names below are the only lines to adapt to the signed
   contract (see docs/SHIPPING_AGGREGATOR.md for the expected shapes).

   Behaviour every aggregator integration needs, already handled here:
     • 15 s timeout per call;
     • reads (rates, tracking) retried twice on network errors and 5xx;
     • label creation sent once with Idempotency-Key = shipment id, so a
       retried click never books two labels;
     • unknown carrier statuses are dropped rather than guessed. */
export function httpDriver(baseUrl: string, apiKey: string, opts: { timeoutMs?: number; retries?: number } = {}): ShippingDriver {
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const retries = opts.retries ?? 2;
  const call = async (path: string, init: RequestInit & { idempotencyKey?: string; retry?: boolean } = {}) => {
    const attempts = init.retry ? retries + 1 : 1;
    let last: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
          ...init,
          signal: AbortSignal.timeout(timeoutMs),
          headers: {
            Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json',
            ...(init.idempotencyKey ? { 'Idempotency-Key': init.idempotencyKey } : {}),
            ...(init.headers ?? {}),
          },
        });
        const body = await res.json().catch(() => ({}));
        if (res.ok) return body;
        last = new Error(body?.message ?? `aggregator ${res.status}`);
        if (res.status < 500) break;               // 4xx: our request is wrong, retrying will not help
      } catch (err) {
        last = err;
      }
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
    throw last instanceof Error ? last : new Error('aggregator unreachable');
  };
  return {
    name: 'http',
    live: true,
    rates: async (req) => {
      const body = await call('/rates', { method: 'POST', body: JSON.stringify(req), retry: true });
      return (body.rates ?? []).map((r: Record<string, unknown>) => ({
        carrier: String(r.carrier), service: String(r.service), amount: Number(r.amount),
        etaDays: [Number(r.min_days ?? 2), Number(r.max_days ?? 7)] as [number, number], source: 'aggregator' as const,
      }));
    },
    createLabel: async (req) => {
      const b = await call('/shipments', { method: 'POST', body: JSON.stringify(req), idempotencyKey: req.reference });
      if (!b.tracking_number) throw new Error('aggregator returned no tracking number');
      return { trackingNo: String(b.tracking_number), labelUrl: String(b.label_url ?? ''), providerRef: String(b.id), cost: Number(b.cost ?? 0) };
    },
    track: async (ref) => {
      const b = await call(`/shipments/${encodeURIComponent(ref)}/events`, { retry: true });
      return (b.events ?? []).flatMap((e: Record<string, unknown>) => {
        const status = mapCarrierStatus(String(e.status));
        return status ? [{ status, at: String(e.timestamp), description: e.description as string, location: e.location as string, raw: e }] : [];
      });
    },
  };
}

const STATUS_MAP: Record<string, TrackingEvent['status']> = {
  in_transit: 'in_transit', transit: 'in_transit', picked_up: 'in_transit', departed: 'in_transit', shipped: 'in_transit',
  arrived_at_hub: 'in_transit', customs_cleared: 'in_transit',
  out_for_delivery: 'out_for_delivery', with_courier: 'out_for_delivery',
  delivered: 'delivered',
  exception: 'exception', failed_attempt: 'exception', on_hold: 'exception', customs_hold: 'exception', address_issue: 'exception',
  returned: 'returned', return_to_sender: 'returned', rto: 'returned',
};
/** Carrier/aggregator status words → the platform's five statuses (null = ignore). */
export function mapCarrierStatus(s: string): TrackingEvent['status'] | null {
  return STATUS_MAP[s.trim().toLowerCase().replace(/[\s-]+/g, '_')] ?? null;
}

export function shippingDriver(): ShippingDriver {
  const provider = Deno.env.get('SHIPPING_PROVIDER') ?? 'manual';
  const url = Deno.env.get('SHIPPING_API_URL');
  const key = Deno.env.get('SHIPPING_API_KEY');
  if (provider === 'http' && url && key) return httpDriver(url, key);
  return manual;
}
