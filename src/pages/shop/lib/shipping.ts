/* Shipping + customs estimation for the checkout.

   Two operating routes, chosen by the sales channel (Decision Log §6):

   retail     → express direct parcel from the factory / Jeddah hub through a
                shipping aggregator. No consolidation fee. A minimum order
                value applies, and the result reports whether freight +
                customs stay within the success metric (≤ 25% of goods).
   group      → several retail buyers in one destination share a consolidated
                parcel (typical for a pilgrims' group or an Umrah agent); the
                handling fee is split between the participants.
   wholesale  → consolidated sea / air from the Jeddah hub with the handling
                + inspection fee and the sea minimum.

   Zones, rates and fees all come from PlatformConfig, so the admin panel can
   re-price a lane without a deploy. Jordan sits in the Levant zone, not the
   Gulf. */

import type { ShippingEstimate } from '@/pages/shop/types';
import { getConfig } from '@/config/store';
import { zoneIdOf, type PlatformConfig } from '@/config/platform';

export type ShipMethod = 'express' | 'group' | 'sea' | 'air';

/* Parses a product's free-text weight ("1 كجم", "500 جم", "3 × 120 جم",
   "18 كجم/م²") into kilograms so the whole cart can be summed. */
export function parseWeightKg(weight: string): number {
  if (!weight) return 0.5;
  const s = weight.replace(/\s+/g, ' ').trim();

  const unitToKg = (unit: string): number => {
    if (/كجم|كيلو|كج|kg/i.test(unit)) return 1;
    // grams (جم / غرام / جرام / g) and millilitres (مل / ml) both ≈ 1 g.
    return 0.001;
  };

  // Multi-pack: "3 × 120 جم"
  const multi = s.match(/(\d+(?:\.\d+)?)\s*[×x]\s*(\d+(?:\.\d+)?)\s*([^\d\s]+)/);
  if (multi) {
    return Number(multi[1]) * Number(multi[2]) * unitToKg(multi[3]);
  }

  const single = s.match(/(\d+(?:\.\d+)?)\s*([^\d\s]+)/);
  if (!single) return 0.5;
  return Number(single[1]) * unitToKg(single[2]);
}

export interface EstimateInput {
  countryCode: string;
  method: ShipMethod;
  netSubtotal: number; // goods value after discounts
  weightKg: number;
  freeShipping?: boolean;
  /** Number of buyers sharing a group parcel (group method only). */
  participants?: number;
}

const MIN_CHARGEABLE_KG = 0.5;

/** Chargeable weight rounded up to the next half kilo, like carriers bill. */
export function chargeableKg(weightKg: number): number {
  const w = Math.max(weightKg, MIN_CHARGEABLE_KG);
  return Math.ceil(w * 2) / 2;
}

export function zoneOf(countryCode: string, cfg: PlatformConfig = getConfig()) {
  const id = zoneIdOf(cfg, countryCode);
  return {
    id,
    express: cfg.shipping.express[id] ?? cfg.shipping.express.southAsia,
    consolidated: cfg.shipping.consolidated[id] ?? cfg.shipping.consolidated.southAsia,
  };
}

/* Full shipping + customs estimate in SAR. */
export function estimateShipping(input: EstimateInput, cfg: PlatformConfig = getConfig()): ShippingEstimate {
  const { countryCode, method, netSubtotal, weightKg, freeShipping } = input;
  const zone = zoneOf(countryCode, cfg);
  const chargeable = chargeableKg(weightKg);
  const goods = Math.max(netSubtotal, 0);

  let shipping = 0;
  let customsRate = zone.express.customs;
  let returnDays = zone.express.returnDays;
  let etaDays: [number, number] = zone.express.etaDays;

  if (method === 'express') {
    shipping = zone.express.base + chargeable * zone.express.perKg;
  } else if (method === 'group') {
    /* One consolidated parcel: the buyer pays air freight on their own kilos
       plus an equal share of a single handling fee. */
    const people = Math.max(cfg.shipping.groupOrder.minParticipants, input.participants ?? 0, 1);
    shipping = chargeable * zone.consolidated.air + cfg.shipping.groupOrder.handlingFee / people;
    customsRate = zone.consolidated.customs;
    returnDays = zone.consolidated.returnDays;
    etaDays = [etaDays[0] + 5, etaDays[1] + 9];
  } else {
    const w = cfg.shipping.wholesale;
    const rate = method === 'air' ? zone.consolidated.air : zone.consolidated.sea;
    shipping = (w.handlingFee + chargeable * rate);
    if (method === 'sea') shipping = Math.max(shipping, w.seaMinimum);
    customsRate = zone.consolidated.customs;
    returnDays = zone.consolidated.returnDays;
    etaDays = method === 'air' ? [7, 14] : [30, 60];
  }

  shipping = freeShipping ? 0 : Math.round(shipping);
  const customs = Math.round(goods * customsRate);
  const total = shipping + customs;
  const counted = cfg.shipping.retail.shareIncludesCustoms ? total : shipping;
  const share = goods > 0 ? counted / goods : 0;
  const retailRoute = method === 'express' || method === 'group';

  return {
    weightKg: chargeable,
    shipping,
    customs,
    total,
    method,
    zone: zone.id,
    share,
    withinTarget: !retailRoute || share <= cfg.shipping.retail.maxShare,
    belowMinOrder: retailRoute && goods < cfg.shipping.retail.minOrder,
    minOrder: cfg.shipping.retail.minOrder,
    returnDays,
    etaDays,
  };
}

/**
 * The cheapest retail route for this cart. When express breaks the shipping
 * share target and group orders are enabled, the group parcel is suggested.
 */
export function suggestRetailMethod(input: Omit<EstimateInput, 'method'>, cfg: PlatformConfig = getConfig()): ShipMethod {
  const express = estimateShipping({ ...input, method: 'express' }, cfg);
  if (express.withinTarget || !cfg.shipping.groupOrder.enabled) return 'express';
  const group = estimateShipping({ ...input, method: 'group' }, cfg);
  return group.total < express.total ? 'group' : 'express';
}
