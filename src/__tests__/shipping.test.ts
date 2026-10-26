import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, normalizeConfig, zoneIdOf } from '@/config/platform';
import { chargeableKg, estimateShipping, parseWeightKg, suggestRetailMethod } from '@/pages/shop/lib/shipping';

const cfg = normalizeConfig(DEFAULT_CONFIG);

describe('zones', () => {
  it('puts Jordan in the Levant, not the Gulf', () => {
    expect(zoneIdOf(cfg, 'jo')).toBe('levant');
    expect(zoneIdOf(cfg, 'ae')).toBe('gulf');
  });
});

describe('retail express', () => {
  it('charges no consolidation fee', () => {
    const e = estimateShipping({ countryCode: 'eg', method: 'express', netSubtotal: 300, weightKg: 1.5 }, cfg);
    // base 35 + 1.5 kg × 24
    expect(e.shipping).toBe(71);
  });

  it('keeps a typical 300 SAR Egypt order within the 25% target', () => {
    const e = estimateShipping({ countryCode: 'eg', method: 'express', netSubtotal: 300, weightKg: 1 }, cfg);
    expect(e.share).toBeLessThanOrEqual(0.25);
    expect(e.withinTarget).toBe(true);
  });

  it('can count destination duties in the metric when the admin asks for it', () => {
    const strict = normalizeConfig({ shipping: { retail: { shareIncludesCustoms: true } } });
    const e = estimateShipping({ countryCode: 'eg', method: 'express', netSubtotal: 300, weightKg: 1 }, strict);
    expect(e.withinTarget).toBe(false);
  });

  it('flags an order under the retail minimum', () => {
    expect(estimateShipping({ countryCode: 'pk', method: 'express', netSubtotal: 90, weightKg: 1 }, cfg).belowMinOrder).toBe(true);
  });

  it('suggests a group parcel when express breaks the target', () => {
    const input = { countryCode: 'pk', netSubtotal: 160, weightKg: 3 };
    expect(estimateShipping({ ...input, method: 'express' }, cfg).withinTarget).toBe(false);
    expect(suggestRetailMethod(input, cfg)).toBe('group');
  });
});

describe('wholesale consolidated', () => {
  it('adds the handling fee and the sea minimum', () => {
    const e = estimateShipping({ countryCode: 'jo', method: 'sea', netSubtotal: 5000, weightKg: 10 }, cfg);
    expect(e.shipping).toBe(260);
    const air = estimateShipping({ countryCode: 'jo', method: 'air', netSubtotal: 5000, weightKg: 10 }, cfg);
    expect(air.shipping).toBe(120 + 10 * 20);
    expect(air.withinTarget).toBe(true);
  });
});

describe('weights', () => {
  it('parses free-text weights', () => {
    expect(parseWeightKg('1 كجم')).toBe(1);
    expect(parseWeightKg('500 جم')).toBe(0.5);
    expect(parseWeightKg('3 × 120 جم')).toBeCloseTo(0.36);
  });
  it('rounds chargeable weight up to the next half kilo', () => {
    expect(chargeableKg(0.2)).toBe(0.5);
    expect(chargeableKg(1.1)).toBe(1.5);
  });
});
