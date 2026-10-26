import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, normalizeConfig } from '@/config/platform';
import { commissionState, settleOrder, totalsOf, type LedgerOrder } from '@/pages/dashboard/lib/economics';

const cfg = normalizeConfig(DEFAULT_CONFIG);
const base: LedgerOrder = {
  id: 'T-1', buyer: 'x', country: 'eg', gross: 1000, segment: 'new', ambassador: 'AHMAD-JO-2481',
  status: '', tone: '', channel: 'retail', ambassadorTier: 'certified',
};

describe('settleOrder — retail', () => {
  it('subtracts the discount and caps it at the platform-funded cap', () => {
    // The audit case: a 10% code on a 1,000 SAR order. Only 4% may be funded.
    const r = settleOrder({ ...base, discount: 100 }, cfg);
    expect(r.take).toBe(180); // 18%
    expect(r.discount).toBe(40); // capped at 4%
    expect(r.discountOverCap).toBe(60);
    expect(r.ambassadorCommission).toBe(70); // certified tier 7%
    expect(r.paymentFee).toBe(28); // 2.9% of 960 actually paid
    expect(r.returnReserve).toBe(10);
    expect(r.net).toBe(180 - 40 - 70 - 28 - 10);
    expect(r.net).toBeGreaterThan(0);
  });

  it('never pays an ambassador on a repeat customer', () => {
    const r = settleOrder({ ...base, segment: 'repeat' }, cfg);
    expect(r.ambassadorCommission).toBe(0);
    expect(r.leaderBonus).toBe(0);
  });

  it('pays the tier rate of the ambassador', () => {
    expect(settleOrder({ ...base, ambassadorTier: 'starter' }, cfg).ambassadorRate).toBe(0.05);
    expect(settleOrder({ ...base, ambassadorTier: 'elite' }, cfg).ambassadorRate).toBe(0.08);
    expect(settleOrder({ ...base, ambassadorTier: 'unknown' }, cfg).ambassadorRate).toBe(0.05);
  });

  it('adds the leader bonus only when a commission is paid', () => {
    expect(settleOrder({ ...base, leader: 'REEM' }, cfg).leaderBonus).toBe(10);
    expect(settleOrder({ ...base, leader: 'REEM', ambassador: '' }, cfg).leaderBonus).toBe(0);
  });

  it('stays profitable in the worst retail case', () => {
    const r = settleOrder({ ...base, ambassadorTier: 'elite', leader: 'L', discount: 999 }, cfg);
    expect(r.net).toBeGreaterThanOrEqual(0);
    expect(r.belowFloor).toBe(false);
  });
});

describe('settleOrder — wholesale', () => {
  const w: LedgerOrder = { ...base, channel: 'wholesale', gross: 20000, monthsSinceFirstDeal: 2, ambassadorTier: undefined };

  it('uses the wholesale take and refuses codes', () => {
    const r = settleOrder({ ...w, discount: 500 }, cfg);
    expect(r.takeRate).toBe(0.06);
    expect(r.discount).toBe(0);
  });

  it('keeps paying on repeat deals inside the recurring window, then stops', () => {
    expect(settleOrder({ ...w, segment: 'repeat', monthsSinceFirstDeal: 11 }, cfg).ambassadorCommission).toBe(400);
    expect(settleOrder({ ...w, segment: 'repeat', monthsSinceFirstDeal: 12 }, cfg).ambassadorCommission).toBe(0);
  });

  it('uses the lower bank-transfer fee', () => {
    expect(settleOrder(w, cfg).paymentFee).toBe(160);
  });
});

describe('floor flag', () => {
  it('flags an order whose margin drops under the floor', () => {
    const tight = normalizeConfig({ ...DEFAULT_CONFIG, costs: { ...DEFAULT_CONFIG.costs, netFloor: 0.05 } });
    const r = settleOrder({ ...base, discount: 40 }, tight);
    expect(r.belowFloor).toBe(true);
    expect(totalsOf([r]).belowFloor).toBe(1);
  });
});

describe('commissionState', () => {
  const now = new Date('2026-10-22T00:00:00Z');
  it('is pending until delivery', () => {
    expect(commissionState({ returnDays: 14, now })).toBe('pending');
  });
  it('is pending inside the destination return window', () => {
    expect(commissionState({ deliveredAt: '2026-10-15T00:00:00Z', returnDays: 14, now })).toBe('pending');
  });
  it('becomes eligible when the window closes', () => {
    expect(commissionState({ deliveredAt: '2026-10-01T00:00:00Z', returnDays: 14, now })).toBe('eligible');
  });
  it('is void when returned and paid when paid out', () => {
    expect(commissionState({ deliveredAt: '2026-10-01', returnDays: 14, returned: true, now })).toBe('void');
    expect(commissionState({ deliveredAt: '2026-10-01', returnDays: 14, paidOut: true, now })).toBe('paid');
  });
});
