import type { PlatformConfig } from './platform';

/* Legal documents: version, page and who must accept them.

   The server keeps the same versions in public.legal_documents (migration
   012) and decides who still has to accept; a vitest test fails if the two
   drift. To publish a new version: change it here AND insert the new row in
   a migration — every account it concerns is then asked to accept it at the
   next sign-in. */

export type LegalDocKey = 'terms' | 'privacy' | 'returns' | 'ambassador' | 'factory';
export type Panel = 'buyer' | 'ambassador' | 'factory' | 'admin';

export const LEGAL_DOCS: Record<LegalDocKey, { version: string; effective: string; path: string }> = {
  terms: { version: '2026-10', effective: '2026-10-25', path: '/terms' },
  privacy: { version: '2026-10', effective: '2026-10-25', path: '/privacy' },
  returns: { version: '2026-10', effective: '2026-10-25', path: '/returns' },
  ambassador: { version: '2026-10', effective: '2026-10-25', path: '/legal/ambassador' },
  factory: { version: '2026-10', effective: '2026-10-25', path: '/legal/factory' },
};

/** Documents each panel must have accepted (the returns policy is informational). */
export const REQUIRED_FOR: Record<Panel, LegalDocKey[]> = {
  buyer: ['terms', 'privacy'],
  ambassador: ['terms', 'privacy', 'ambassador'],
  factory: ['terms', 'privacy', 'factory'],
  admin: ['terms', 'privacy'],
};

/** Where the database is hosted — stated in the privacy policy (PDPL cross-border disclosure). */
export const DATA_REGION = (import.meta.env.VITE_DATA_REGION as string | undefined) || 'تُحدَّد عند الإطلاق / set at launch';

const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;

/** Values interpolated into the legal texts, so the contracts quote the live settings. */
export function legalValues(cfg: PlatformConfig): Record<string, string | number> {
  const tiers = cfg.ambassador.retailTiers;
  const t = (i: number) => tiers[Math.min(i, tiers.length - 1)];
  return {
    retailTake: pct(cfg.take.retail.value),
    retailTakeMin: pct(cfg.take.retail.min),
    retailTakeMax: pct(cfg.take.retail.max),
    wholesaleTake: pct(cfg.take.wholesale.value),
    tierStarter: pct(t(0).rate),
    tierCertified: pct(t(1).rate),
    tierElite: pct(t(2).rate),
    tierCertifiedMin: t(1).minOrders,
    tierEliteMin: t(2).minOrders,
    tierWindow: cfg.ambassador.tierWindowDays,
    wholesaleAmb: pct(cfg.ambassador.wholesale.value),
    recurringMonths: cfg.ambassador.wholesaleRecurringMonths,
    leaderBonus: pct(cfg.ambassador.leaderBonus),
    attributionDays: cfg.ambassador.attributionDays,
    minPayout: cfg.ambassador.minPayout,
    promoCap: pct(cfg.promo.capRate),
    returnsDomestic: cfg.shipping.express.domestic?.returnDays ?? 7,
    dataRegion: DATA_REGION,
  };
}
