import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { resolve } from 'node:path';
import { DEFAULT_CONFIG, normalizeConfig } from '@/config/platform';
import { estimateShipping } from '@/pages/shop/lib/shipping';
import { ambassadorRateFor } from '@/pages/dashboard/lib/economics';
import {
  capDiscount, commissionsFor, priceOrder, PricingError, shippingFor, type ProductRow,
} from '../../supabase/functions/_shared/pricing';

const cfg = normalizeConfig(DEFAULT_CONFIG);

describe('server copy of PlatformConfig', () => {
  it('is identical to src/config/platform.ts (run npm run sync:shared)', () => {
    const root = process.cwd();
    const src = readFileSync(resolve(root, 'src/config/platform.ts'), 'utf8');
    const copy = readFileSync(resolve(root, 'supabase/functions/_shared/platform.ts'), 'utf8');
    expect(copy.split('\n').slice(1).join('\n')).toBe(src);
  });
});

describe('server shipping = storefront shipping', () => {
  const countries = ['eg', 'pk', 'id', 'jo', 'ae', 'sa', 'gb', 'us', 'ng'];
  const methods = ['express', 'group', 'sea', 'air'] as const;
  it.each(countries)('%s', (cc) => {
    methods.forEach((method) => {
      [0.4, 1, 2.7, 25].forEach((kg) => {
        const a = estimateShipping({ countryCode: cc, method, netSubtotal: 640, weightKg: kg }, cfg);
        const b = shippingFor(cfg, { countryCode: cc, method, goods: 640, weightKg: kg });
        expect([b.shipping, b.customs, b.returnDays]).toEqual([a.shipping, a.customs, a.returnDays]);
      });
    });
  });
});

describe('server discount cap', () => {
  it('caps at 4% and refuses wholesale', () => {
    const promo = { code: 'X', kind: 'percent' as const, value: 15, min_subtotal: 0 };
    expect(capDiscount(cfg, 'retail', 1000, promo)).toBe(40);
    expect(capDiscount(cfg, 'wholesale', 1000, promo)).toBe(0);
  });
});

describe('server commissions = ledger commissions', () => {
  it('matches the ledger rate for each case', () => {
    const cases = [
      { channel: 'retail' as const, newCustomer: true, tier: 'elite', months: 0 },
      { channel: 'retail' as const, newCustomer: false, tier: 'elite', months: 0 },
      { channel: 'wholesale' as const, newCustomer: false, tier: 'starter', months: 5 },
      { channel: 'wholesale' as const, newCustomer: false, tier: 'starter', months: 13 },
    ];
    cases.forEach((c) => {
      const server = commissionsFor(cfg, {
        channel: c.channel, goods: 1000, newCustomer: c.newCustomer, ambassadorTier: c.tier, hasLeader: true, monthsSinceFirstDeal: c.months,
      });
      const ledger = ambassadorRateFor({
        id: 'x', buyer: '', country: '', gross: 1000, segment: c.newCustomer ? 'new' : 'repeat', ambassador: 'A', status: '', tone: '',
        channel: c.channel, ambassadorTier: c.tier, monthsSinceFirstDeal: c.months,
      }, cfg);
      expect(server.find((r) => r.kind === 'ambassador')?.rate ?? 0).toBe(ledger);
    });
  });
});

describe('priceOrder', () => {
  const dates: ProductRow = { id: 'dates-khalas', factory_id: 'hasa', category_id: 'dates', price: 89, weight_kg: 1, moq: 50, tiers: [{ min: 50, max: 199, price: 62 }], active: true };
  const oud: ProductRow = { id: 'oud-dehn', factory_id: 'oud', category_id: 'oud', price: 160, weight_kg: 0.2, moq: 24, tiers: [], active: true };
  const tile: ProductRow = { id: 'tile', factory_id: 'x', category_id: 'building', price: 70, weight_kg: 18, moq: 500, tiers: [], active: true };

  it('splits by factory and allocates the capped discount exactly', () => {
    const r = priceOrder(cfg, {
      lines: [{ product: dates, qty: 2 }, { product: oud, qty: 1 }],
      countryCode: 'eg', method: 'express', promo: { code: 'SAFEER4', kind: 'percent', value: 10, min_subtotal: 0 },
    });
    expect(r.channel).toBe('retail');
    expect(r.goods).toBe(338);
    expect(r.discount).toBe(13); // floor(338 × 4%)
    expect(r.subOrders.reduce((s, x) => s + x.discount, 0)).toBe(13);
    expect(r.subOrders).toHaveLength(2);
    expect(r.vat).toBe(0);
  });

  it('switches to wholesale at the MOQ and rejects an express method', () => {
    expect(() => priceOrder(cfg, { lines: [{ product: dates, qty: 60 }], countryCode: 'jo', method: 'express', promo: null }))
      .toThrow(PricingError);
    const r = priceOrder(cfg, { lines: [{ product: dates, qty: 60 }], countryCode: 'jo', method: 'sea', promo: null });
    expect(r.channel).toBe('wholesale');
    expect(r.goods).toBe(60 * 62);
    expect(r.subOrders[0].takeRate).toBe(0.06);
  });

  it('refuses categories that are not on sale and orders below the minimum', () => {
    expect(() => priceOrder(cfg, { lines: [{ product: tile, qty: 500 }], countryCode: 'eg', method: 'sea', promo: null })).toThrow(/not on sale/);
    expect(() => priceOrder(cfg, { lines: [{ product: dates, qty: 1 }], countryCode: 'eg', method: 'express', promo: null })).toThrow(/minimum/);
  });

  it('charges 15% VAT inside the Kingdom', () => {
    const r = priceOrder(cfg, { lines: [{ product: oud, qty: 2 }], countryCode: 'sa', method: 'express', promo: null });
    expect(r.vat).toBe(48);
  });
});
