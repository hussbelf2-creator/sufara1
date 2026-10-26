import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONFIG, configProblems, normalizeConfig, tierFor, worstCaseRetailMargin, worstCaseWholesaleMargin,
} from '@/config/platform';
import { activeVersionAt, type ConfigVersion } from '@/config/store';

describe('PlatformConfig', () => {
  it('ships a publishable default', () => {
    const cfg = normalizeConfig(DEFAULT_CONFIG);
    expect(configProblems(cfg)).toEqual([]);
    expect(worstCaseRetailMargin(cfg)).toBeGreaterThanOrEqual(0);
    expect(worstCaseWholesaleMargin(cfg)).toBeGreaterThanOrEqual(0);
  });

  it('clamps rates into the decided bands', () => {
    const cfg = normalizeConfig({ take: { retail: { value: 0.4 }, wholesale: { value: 0.01 } } });
    expect(cfg.take.retail.value).toBe(0.2);
    expect(cfg.take.wholesale.value).toBe(0.05);
    expect(cfg.take.retail.min).toBe(0.15);
  });

  it('never lets the ambassador code exceed the cap', () => {
    const cfg = normalizeConfig({ promo: { capRate: 0.03, ambassadorCodeRate: 0.1 } });
    expect(cfg.promo.ambassadorCodeRate).toBe(0.03);
  });

  it('keeps the team one level deep', () => {
    expect(normalizeConfig({ ambassador: { teamDepth: 5 } }).ambassador.teamDepth).toBe(1);
  });

  it('refuses a combination that loses money', () => {
    const cfg = normalizeConfig({ take: { retail: { value: 0.15 } }, ambassador: { leaderBonus: 0.02 } });
    expect(configProblems(cfg)).toContain('retailMarginBelowFloor');
  });

  it('places ambassadors in tiers by delivered orders', () => {
    const cfg = normalizeConfig(DEFAULT_CONFIG);
    expect(tierFor(cfg, 0).id).toBe('starter');
    expect(tierFor(cfg, 10).id).toBe('certified');
    expect(tierFor(cfg, 75).id).toBe('elite');
  });

  it('activates the newest version whose date has arrived', () => {
    const v = (version: number, effectiveFrom: string): ConfigVersion => ({
      version, effectiveFrom, note: '', createdBy: '', createdAt: '', payload: normalizeConfig(DEFAULT_CONFIG),
    });
    const list = [v(1, '2026-01-01'), v(2, '2026-10-01'), v(3, '2027-01-01')];
    expect(activeVersionAt(list, new Date('2026-10-22'))?.version).toBe(2);
    expect(activeVersionAt(list, new Date('2027-02-01'))?.version).toBe(3);
  });
});
