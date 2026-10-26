// GENERATED from src/config/platform.ts by scripts/sync-shared.mjs — do not edit.
/* ─────────────────────────────────────────────────────────────────────────
   سفير · Safeer — the single source of truth for every business number.

   Nothing in the storefront, the checkout, the ledger or the dashboards may
   hard-code a rate, a fee, a zone or a category. They all read the active
   PlatformConfig from here, and the admin "Platform settings" module writes
   new versions of it (each with an effective date) to `platform_settings`.

   The defaults below are the decisions recorded in docs/DECISION_LOG.md.
   Changing a number means: write a decision, then publish a new version from
   the admin panel — never edit a constant in a view.
   ───────────────────────────────────────────────────────────────────────── */

export type SalesChannel = 'retail' | 'wholesale';
export type LangCode = 'ar' | 'en' | 'ur' | 'id';

/** A rate that the admin can move only inside a decided band. */
export interface BandedRate {
  value: number;
  min: number;
  max: number;
}

export interface AmbassadorTier {
  id: string;
  /** Translation key suffix: ambassador.tier.<id> */
  labelAr: string;
  labelEn: string;
  /** Delivered attributed retail orders in the trailing window to reach the tier. */
  minOrders: number;
  rate: number;
}

export interface AcquisitionChannel {
  id: string;
  labelAr: string;
  labelEn: string;
  enabled: boolean;
  /** The channel the platform launches with. Exactly one should be true. */
  launch: boolean;
  icon: string;
}

export interface CurrencyDef {
  code: string;
  symbolAr: string;
  symbolEn: string;
  /** Units of this currency per 1 SAR. Display only — settlement is in SAR. */
  perSar: number;
  decimals: number;
}

export interface ExpressZone {
  /** Fixed per-parcel fee in SAR (pickup, label, last mile). */
  base: number;
  /** SAR per chargeable kg. */
  perKg: number;
  /** Customs + duties as a share of the goods value (DDP estimate). */
  customs: number;
  /** Return window in the destination country, days after delivery. */
  returnDays: number;
  etaDays: [number, number];
}

export interface ConsolidatedZone {
  sea: number;
  air: number;
  customs: number;
  returnDays: number;
}

export interface PlatformConfig {
  version: number;
  effectiveFrom: string; // ISO date
  note: string;

  brand: { nameAr: string; nameEn: string; taglineAr: string; taglineEn: string; domain: string };

  /* Platform take — a share of the goods value after wholesale pricing. */
  take: Record<SalesChannel, BandedRate>;

  ambassador: {
    retailTiers: AmbassadorTier[];
    /** Trailing window (days) used to place an ambassador in a tier. */
    tierWindowDays: number;
    /** 'first_order' pays only on a new customer's first order. */
    retailScope: 'first_order' | 'every_order_in_window';
    wholesale: BandedRate;
    /** Wholesale commission keeps recurring on the same buyer for N months. */
    wholesaleRecurringMonths: number;
    /** Leader ("السفير القائد") override on the direct team's commissionable sales. */
    leaderBonus: number;
    /** Team depth is capped — one level only, no MLM. */
    teamDepth: 1;
    /** Cookie / remembered-code attribution window in days. */
    attributionDays: number;
    minPayout: number;
  };

  promo: {
    /** Max discount (share of goods) the platform will fund on any code. */
    capRate: number;
    /** Default discount carried by an ambassador page code. */
    ambassadorCodeRate: number;
    /** Channels where codes are accepted. Wholesale deals are negotiated, not couponed. */
    channels: SalesChannel[];
  };

  costs: {
    /** Gateway fee per channel: cards / mada / Apple Pay for retail, bank transfer for wholesale. */
    paymentFee: Record<SalesChannel, number>;
    returnReserve: Record<SalesChannel, number>;
    /** An order is flagged — and a settings version refused — below this margin. */
    netFloor: number;
  };

  shipping: {
    retail: {
      method: 'express';
      minOrder: number;
      /** Success metric: logistics cost ≤ this share of the goods value. */
      maxShare: number;
      /** Count destination duties in the metric (they are taxes, not logistics). */
      shareIncludesCustoms: boolean;
      volumetricDivisor: number;
    };
    wholesale: {
      handlingFee: number;
      seaMinimum: number;
      marginOnFreight: number;
    };
    groupOrder: {
      enabled: boolean;
      /** Handling fee split across the participants of one consolidated parcel. */
      handlingFee: number;
      minParticipants: number;
    };
    countryZone: Record<string, string>;
    express: Record<string, ExpressZone>;
    consolidated: Record<string, ConsolidatedZone>;
  };

  tax: { domesticVat: number; exportVat: number; sellerVatNo: string; sellerCrn: string };

  catalog: {
    /** Category ids visible on the storefront. Others stay in the database. */
    enabledCategories: string[];
    /** Categories eligible for single-parcel retail. */
    retailCategories: string[];
  };

  channels: AcquisitionChannel[];

  locale: {
    languages: LangCode[];
    defaultLanguage: LangCode;
    baseCurrency: 'SAR';
    currencies: CurrencyDef[];
    countryCurrency: Record<string, string>;
    countryLanguage: Record<string, LangCode>;
  };

  security: {
    demoLogin: boolean;
    requireMfaForAdmin: boolean;
    maxUploadMb: { image: number; video: number };
  };
}

export const DEFAULT_CONFIG: PlatformConfig = {
  version: 1,
  effectiveFrom: '2026-10-01',
  note: 'Decision Log v1 — اعتماد الاسم «سفير»، قناة الإطلاق المعتمرون والحجاج، فصل التجزئة عن الجملة.',

  brand: {
    nameAr: 'سفير',
    nameEn: 'Safeer',
    taglineAr: 'سفراء التجارة السعودية',
    taglineEn: 'Saudi Trade Ambassadors',
    domain: 'safeer.sa',
  },

  take: {
    retail: { value: 0.18, min: 0.15, max: 0.2 },
    wholesale: { value: 0.06, min: 0.05, max: 0.08 },
  },

  ambassador: {
    retailTiers: [
      { id: 'starter', labelAr: 'سفير', labelEn: 'Ambassador', minOrders: 0, rate: 0.05 },
      { id: 'certified', labelAr: 'سفير معتمد', labelEn: 'Certified ambassador', minOrders: 10, rate: 0.07 },
      { id: 'elite', labelAr: 'سفير نخبة', labelEn: 'Elite ambassador', minOrders: 50, rate: 0.08 },
    ],
    tierWindowDays: 90,
    retailScope: 'first_order',
    wholesale: { value: 0.02, min: 0.015, max: 0.03 },
    wholesaleRecurringMonths: 12,
    leaderBonus: 0.01,
    teamDepth: 1,
    attributionDays: 30,
    minPayout: 200,
  },

  promo: {
    capRate: 0.04,
    ambassadorCodeRate: 0.04,
    channels: ['retail'],
  },

  costs: {
    paymentFee: { retail: 0.029, wholesale: 0.008 },
    returnReserve: { retail: 0.01, wholesale: 0.005 },
    netFloor: 0,
  },

  shipping: {
    retail: { method: 'express', minOrder: 150, maxShare: 0.25, shareIncludesCustoms: false, volumetricDivisor: 5000 },
    wholesale: { handlingFee: 120, seaMinimum: 260, marginOnFreight: 0.3 },
    groupOrder: { enabled: true, handlingFee: 120, minParticipants: 5 },
    countryZone: {
      sa: 'domestic',
      ae: 'gulf', kw: 'gulf', bh: 'gulf', qa: 'gulf', om: 'gulf',
      jo: 'levant', lb: 'levant', iq: 'levant', ps: 'levant', sy: 'levant',
      eg: 'mena', ma: 'mena', dz: 'mena', tn: 'mena', tr: 'mena',
      pk: 'southAsia', bd: 'southAsia', in: 'southAsia',
      id: 'seAsia', my: 'seAsia', sg: 'seAsia', th: 'seAsia', ph: 'seAsia',
      ng: 'africa', ke: 'africa', za: 'africa', sn: 'africa',
      gb: 'europe', fr: 'europe', de: 'europe', nl: 'europe',
      us: 'americas', ca: 'americas',
    },
    express: {
      domestic: { base: 18, perKg: 4, customs: 0, returnDays: 7, etaDays: [1, 3] },
      gulf: { base: 25, perKg: 14, customs: 0.05, returnDays: 14, etaDays: [2, 4] },
      levant: { base: 32, perKg: 20, customs: 0.08, returnDays: 14, etaDays: [3, 6] },
      mena: { base: 35, perKg: 24, customs: 0.09, returnDays: 14, etaDays: [3, 7] },
      southAsia: { base: 38, perKg: 26, customs: 0.1, returnDays: 14, etaDays: [4, 8] },
      seAsia: { base: 42, perKg: 28, customs: 0.1, returnDays: 14, etaDays: [4, 9] },
      africa: { base: 55, perKg: 36, customs: 0.15, returnDays: 21, etaDays: [5, 10] },
      europe: { base: 48, perKg: 32, customs: 0.13, returnDays: 14, etaDays: [3, 7] },
      americas: { base: 60, perKg: 40, customs: 0.11, returnDays: 30, etaDays: [4, 9] },
    },
    consolidated: {
      domestic: { sea: 3, air: 8, customs: 0, returnDays: 7 },
      gulf: { sea: 5, air: 16, customs: 0.05, returnDays: 14 },
      levant: { sea: 6.5, air: 20, customs: 0.08, returnDays: 14 },
      mena: { sea: 7.5, air: 24, customs: 0.09, returnDays: 14 },
      southAsia: { sea: 8.5, air: 26, customs: 0.1, returnDays: 14 },
      seAsia: { sea: 9, air: 28, customs: 0.12, returnDays: 14 },
      africa: { sea: 11, air: 34, customs: 0.15, returnDays: 21 },
      europe: { sea: 10, air: 30, customs: 0.13, returnDays: 14 },
      americas: { sea: 13, air: 42, customs: 0.11, returnDays: 30 },
    },
  },

  tax: { domesticVat: 0.15, exportVat: 0, sellerVatNo: '310123456700003', sellerCrn: '1010478231' },

  catalog: {
    enabledCategories: ['dates', 'coffee', 'oud', 'beauty', 'crafts'],
    retailCategories: ['dates', 'coffee', 'oud', 'beauty', 'crafts'],
  },

  channels: [
    { id: 'pilgrims', labelAr: 'المعتمرون والحجاج', labelEn: 'Umrah & Hajj pilgrims', enabled: true, launch: true, icon: 'ri-moon-clear-line' },
    { id: 'umrahAgents', labelAr: 'وكلاء العمرة والحج (سفراء قادة)', labelEn: 'Umrah & Hajj agents (leaders)', enabled: true, launch: false, icon: 'ri-team-line' },
    { id: 'diaspora', labelAr: 'الجاليات والمقيمون', labelEn: 'Diaspora & residents', enabled: false, launch: false, icon: 'ri-global-line' },
    { id: 'tourists', labelAr: 'السيّاح وزوّار الفعاليات', labelEn: 'Tourists & event visitors', enabled: false, launch: false, icon: 'ri-map-pin-user-line' },
    { id: 'creators', labelAr: 'صنّاع المحتوى', labelEn: 'Content creators', enabled: false, launch: false, icon: 'ri-live-line' },
    { id: 'traders', labelAr: 'تجّار الجملة والموزّعون', labelEn: 'Wholesale traders & distributors', enabled: true, launch: false, icon: 'ri-store-3-line' },
  ],

  locale: {
    languages: ['ar', 'en', 'ur', 'id'],
    defaultLanguage: 'ar',
    baseCurrency: 'SAR',
    currencies: [
      { code: 'SAR', symbolAr: 'ر.س', symbolEn: 'SAR', perSar: 1, decimals: 0 },
      { code: 'USD', symbolAr: '$', symbolEn: '$', perSar: 0.2666, decimals: 2 },
      { code: 'PKR', symbolAr: 'روبية', symbolEn: 'Rs', perSar: 74.2, decimals: 0 },
      { code: 'EGP', symbolAr: 'ج.م', symbolEn: 'EGP', perSar: 12.9, decimals: 0 },
      { code: 'IDR', symbolAr: 'روبية', symbolEn: 'Rp', perSar: 4330, decimals: 0 },
      { code: 'AED', symbolAr: 'د.إ', symbolEn: 'AED', perSar: 0.979, decimals: 2 },
      { code: 'JOD', symbolAr: 'د.أ', symbolEn: 'JOD', perSar: 0.189, decimals: 2 },
      { code: 'TRY', symbolAr: 'ل.ت', symbolEn: '₺', perSar: 9.1, decimals: 0 },
      { code: 'MYR', symbolAr: 'رنجت', symbolEn: 'RM', perSar: 1.18, decimals: 2 },
      { code: 'BDT', symbolAr: 'تاكا', symbolEn: '৳', perSar: 32.4, decimals: 0 },
      { code: 'EUR', symbolAr: '€', symbolEn: '€', perSar: 0.245, decimals: 2 },
      { code: 'GBP', symbolAr: '£', symbolEn: '£', perSar: 0.205, decimals: 2 },
    ],
    countryCurrency: {
      sa: 'SAR', us: 'USD', pk: 'PKR', eg: 'EGP', id: 'IDR', ae: 'AED', jo: 'JOD', tr: 'TRY',
      my: 'MYR', bd: 'BDT', fr: 'EUR', de: 'EUR', gb: 'GBP',
    },
    countryLanguage: { pk: 'ur', id: 'id', my: 'id', eg: 'ar', jo: 'ar', ae: 'ar', sa: 'ar', gb: 'en', us: 'en' },
  },

  security: {
    demoLogin: true,
    requireMfaForAdmin: true,
    maxUploadMb: { image: 8, video: 60 },
  },
};

/* ───────────────────────────── validation ──────────────────────────────
   Whatever comes back from the database (or a hand-edited admin form) is
   clamped into the decided bands, so a typo can never publish a 40% take or
   an ambassador code larger than the platform-funded cap. */

const clamp = (n: unknown, min: number, max: number, fallback: number): number => {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : fallback;
  return Math.min(max, Math.max(min, v));
};

function band(input: Partial<BandedRate> | undefined, base: BandedRate): BandedRate {
  /* The band itself is a decision: the admin moves the value, not the limits. */
  return { min: base.min, max: base.max, value: clamp(input?.value, base.min, base.max, base.value) };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function deepMerge<T>(base: T, patch: unknown): T {
  if (!isObject(patch) || !isObject(base)) return (patch === undefined ? base : (patch as T));
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  Object.keys(patch).forEach((key) => {
    const b = (base as Record<string, unknown>)[key];
    const p = patch[key];
    if (p === undefined) return;
    out[key] = isObject(b) && isObject(p) ? deepMerge(b, p) : p;
  });
  return out as T;
}

export function normalizeConfig(patch: unknown): PlatformConfig {
  const merged = deepMerge(DEFAULT_CONFIG, patch);
  const d = DEFAULT_CONFIG;

  merged.take = {
    retail: band(merged.take?.retail, d.take.retail),
    wholesale: band(merged.take?.wholesale, d.take.wholesale),
  };

  const tiers = Array.isArray(merged.ambassador.retailTiers) && merged.ambassador.retailTiers.length
    ? merged.ambassador.retailTiers
    : d.ambassador.retailTiers;
  merged.ambassador.retailTiers = tiers
    .map((tier) => ({ ...tier, minOrders: Math.max(0, Math.floor(tier.minOrders || 0)), rate: clamp(tier.rate, 0, 0.1, 0.05) }))
    .sort((a, b) => a.minOrders - b.minOrders);
  merged.ambassador.wholesale = band(merged.ambassador.wholesale, d.ambassador.wholesale);
  merged.ambassador.leaderBonus = clamp(merged.ambassador.leaderBonus, 0, 0.02, d.ambassador.leaderBonus);
  merged.ambassador.wholesaleRecurringMonths = Math.round(clamp(merged.ambassador.wholesaleRecurringMonths, 0, 24, 12));
  merged.ambassador.teamDepth = 1;

  merged.promo.capRate = clamp(merged.promo.capRate, 0, 0.1, d.promo.capRate);
  merged.promo.ambassadorCodeRate = Math.min(
    merged.promo.capRate,
    clamp(merged.promo.ambassadorCodeRate, 0, 0.1, d.promo.ambassadorCodeRate),
  );

  (['retail', 'wholesale'] as SalesChannel[]).forEach((ch) => {
    merged.costs.paymentFee[ch] = clamp(merged.costs.paymentFee?.[ch], 0, 0.06, d.costs.paymentFee[ch]);
    merged.costs.returnReserve[ch] = clamp(merged.costs.returnReserve?.[ch], 0, 0.05, d.costs.returnReserve[ch]);
  });
  merged.costs.netFloor = clamp(merged.costs.netFloor, -0.05, 0.1, d.costs.netFloor);
  if (!Array.isArray(merged.promo.channels)) merged.promo.channels = d.promo.channels;

  merged.shipping.retail.maxShare = clamp(merged.shipping.retail.maxShare, 0.05, 0.6, 0.25);
  merged.shipping.retail.minOrder = Math.max(0, Number(merged.shipping.retail.minOrder) || 0);

  if (!merged.locale.languages.includes('ar')) merged.locale.languages = ['ar', ...merged.locale.languages];
  if (!merged.catalog.enabledCategories?.length) merged.catalog.enabledCategories = d.catalog.enabledCategories;

  /* Demo login can be switched on from the panel only outside production. */
  /* (import.meta.env is Vite-only; the server copy of this file runs on Deno.) */
  const env = (import.meta as unknown as { env?: Record<string, unknown> }).env;
  if (env?.PROD && env?.VITE_ENABLE_DEMO !== 'true') merged.security.demoLogin = false;

  return merged;
}

/* ─────────────────────────── derived helpers ─────────────────────────── */

export function zoneIdOf(cfg: PlatformConfig, countryCode: string): string {
  return cfg.shipping.countryZone[(countryCode || '').toLowerCase()] ?? 'southAsia';
}

export function tierFor(cfg: PlatformConfig, deliveredOrders: number): AmbassadorTier {
  const tiers = cfg.ambassador.retailTiers;
  let current = tiers[0];
  tiers.forEach((t) => {
    if (deliveredOrders >= t.minOrders) current = t;
  });
  return current;
}

export function tierById(cfg: PlatformConfig, id: string | undefined): AmbassadorTier {
  return cfg.ambassador.retailTiers.find((t) => t.id === id) ?? cfg.ambassador.retailTiers[0];
}

export function launchChannel(cfg: PlatformConfig): AcquisitionChannel {
  return cfg.channels.find((c) => c.launch) ?? cfg.channels[0];
}

/**
 * Worst-case retail margin with every deduction at its ceiling.
 * Shown on the admin settings page so a combination that loses money on a
 * perfectly normal order is visible before it is published.
 */
export function worstCaseRetailMargin(cfg: PlatformConfig): number {
  const topTier = cfg.ambassador.retailTiers.reduce((m, t) => Math.max(m, t.rate), 0);
  return cfg.take.retail.value
    - topTier
    - cfg.ambassador.leaderBonus
    - (cfg.promo.channels.includes('retail') ? cfg.promo.capRate : 0)
    - cfg.costs.paymentFee.retail
    - cfg.costs.returnReserve.retail;
}

export function worstCaseWholesaleMargin(cfg: PlatformConfig): number {
  return cfg.take.wholesale.value
    - cfg.ambassador.wholesale.value
    - cfg.ambassador.leaderBonus
    - (cfg.promo.channels.includes('wholesale') ? cfg.promo.capRate : 0)
    - cfg.costs.paymentFee.wholesale
    - cfg.costs.returnReserve.wholesale;
}

/** Problems that block publishing a settings version. Empty = publishable. */
export function configProblems(cfg: PlatformConfig): string[] {
  const problems: string[] = [];
  if (worstCaseRetailMargin(cfg) < cfg.costs.netFloor) problems.push('retailMarginBelowFloor');
  if (worstCaseWholesaleMargin(cfg) < cfg.costs.netFloor) problems.push('wholesaleMarginBelowFloor');
  if (cfg.channels.filter((c) => c.launch).length !== 1) problems.push('launchChannelCount');
  if (!cfg.catalog.enabledCategories.length) problems.push('noCategories');
  if (!cfg.effectiveFrom || Number.isNaN(Date.parse(cfg.effectiveFrom))) problems.push('effectiveDate');
  return problems;
}
