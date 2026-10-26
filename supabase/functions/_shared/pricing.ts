/* Server-side pricing. Pure functions — no Deno or network APIs — so the
   storefront test-suite can import this file and prove the server charges
   exactly what the checkout showed (src/__tests__/server-parity.test.ts). */

import { normalizeConfig, zoneIdOf, tierById, type PlatformConfig, type SalesChannel } from './platform.ts';

export type ShipMethod = 'express' | 'group' | 'sea' | 'air';

export interface ProductRow {
  id: string;
  factory_id: string;
  category_id: string;
  price: number;
  weight_kg: number;
  moq: number | null;
  tiers: { min: number; max: number; price: number }[];
  active: boolean;
}

export interface PromoRow {
  code: string;
  kind: 'percent' | 'fixed';
  value: number;
  min_subtotal: number;
}

export function unitPrice(p: ProductRow, qty: number): number {
  let unit = p.price;
  [...(p.tiers ?? [])].sort((a, b) => a.min - b.min).forEach((t) => {
    if (qty >= t.min && (t.max === 0 || qty <= t.max)) unit = t.price;
  });
  return unit;
}

export function channelOf(lines: { product: ProductRow; qty: number }[]): SalesChannel {
  return lines.some((l) => l.product.moq && l.qty >= l.product.moq) ? 'wholesale' : 'retail';
}

export function capDiscount(cfg: PlatformConfig, channel: SalesChannel, goods: number, promo: PromoRow | null): number {
  if (!promo || !cfg.promo.channels.includes(channel) || goods < promo.min_subtotal || goods <= 0) return 0;
  const raw = promo.kind === 'percent' ? Math.round((goods * promo.value) / 100) : Math.min(promo.value, goods);
  return Math.max(0, Math.min(raw, Math.floor(goods * cfg.promo.capRate)));
}

export function shippingFor(cfg: PlatformConfig, input: {
  countryCode: string; method: ShipMethod; goods: number; weightKg: number; participants?: number;
}) {
  const id = zoneIdOf(cfg, input.countryCode);
  const ex = cfg.shipping.express[id] ?? cfg.shipping.express.southAsia;
  const co = cfg.shipping.consolidated[id] ?? cfg.shipping.consolidated.southAsia;
  const kg = Math.ceil(Math.max(input.weightKg, 0.5) * 2) / 2;
  let shipping = 0;
  let customsRate = ex.customs;
  let returnDays = ex.returnDays;
  if (input.method === 'express') {
    shipping = ex.base + kg * ex.perKg;
  } else if (input.method === 'group') {
    const people = Math.max(cfg.shipping.groupOrder.minParticipants, input.participants ?? 0, 1);
    shipping = kg * co.air + cfg.shipping.groupOrder.handlingFee / people;
    customsRate = co.customs;
    returnDays = co.returnDays;
  } else {
    shipping = cfg.shipping.wholesale.handlingFee + kg * (input.method === 'air' ? co.air : co.sea);
    if (input.method === 'sea') shipping = Math.max(shipping, cfg.shipping.wholesale.seaMinimum);
    customsRate = co.customs;
    returnDays = co.returnDays;
  }
  return {
    zone: id,
    weightKg: kg,
    shipping: Math.round(shipping),
    customs: Math.round(Math.max(input.goods, 0) * customsRate),
    returnDays,
  };
}

export interface PricedOrder {
  channel: SalesChannel;
  goods: number;
  discount: number;
  shipping: number;
  customs: number;
  vat: number;
  total: number;
  returnDays: number;
  subOrders: {
    factoryId: string;
    goods: number;
    discount: number;
    takeRate: number;
    take: number;
    items: { productId: string; qty: number; unit: number; total: number }[];
  }[];
}

export class PricingError extends Error {}

export function priceOrder(rawCfg: unknown, input: {
  lines: { product: ProductRow; qty: number }[];
  countryCode: string;
  method: ShipMethod;
  promo: PromoRow | null;
  participants?: number;
}): PricedOrder {
  const cfg = normalizeConfig(rawCfg);
  if (!input.lines.length) throw new PricingError('empty order');
  input.lines.forEach((l) => {
    if (!l.product.active) throw new PricingError(`product ${l.product.id} unavailable`);
    if (!cfg.catalog.enabledCategories.includes(l.product.category_id)) throw new PricingError(`category ${l.product.category_id} not on sale`);
    if (!Number.isInteger(l.qty) || l.qty < 1 || l.qty > 100000) throw new PricingError('bad quantity');
  });
  const channel = channelOf(input.lines);
  if ((channel === 'retail') !== (input.method === 'express' || input.method === 'group')) {
    throw new PricingError('shipping method does not match the channel');
  }
  if (channel === 'retail') {
    const notRetail = input.lines.find((l) => !cfg.catalog.retailCategories.includes(l.product.category_id));
    if (notRetail) throw new PricingError(`category ${notRetail.product.category_id} is wholesale only`);
  }

  const byFactory = new Map<string, PricedOrder['subOrders'][number]>();
  let weight = 0;
  input.lines.forEach((l) => {
    const unit = unitPrice(l.product, l.qty);
    const total = Math.round(unit * l.qty * 100) / 100;
    weight += Number(l.product.weight_kg) * l.qty;
    const sub = byFactory.get(l.product.factory_id) ?? {
      factoryId: l.product.factory_id, goods: 0, discount: 0, takeRate: cfg.take[channel].value, take: 0, items: [],
    };
    sub.goods += total;
    sub.items.push({ productId: l.product.id, qty: l.qty, unit, total });
    byFactory.set(l.product.factory_id, sub);
  });

  const subOrders = [...byFactory.values()];
  const goods = subOrders.reduce((s, x) => s + x.goods, 0);
  if (channel === 'retail' && goods < cfg.shipping.retail.minOrder) throw new PricingError('below retail minimum');
  const discount = capDiscount(cfg, channel, goods, input.promo);

  /* Spread the discount over sub-orders by goods share; the remainder goes to
     the largest so the parts always add up to the whole. */
  let allocated = 0;
  const sorted = [...subOrders].sort((a, b) => b.goods - a.goods);
  sorted.forEach((s, i) => {
    s.discount = i === sorted.length - 1 ? 0 : Math.floor((discount * s.goods) / goods);
    allocated += s.discount;
    s.take = Math.round(s.goods * s.takeRate);
  });
  sorted[0].discount += discount - allocated;

  const ship = shippingFor(cfg, { countryCode: input.countryCode, method: input.method, goods: goods - discount, weightKg: weight, participants: input.participants });
  const domestic = input.countryCode.toLowerCase() === 'sa';
  const vat = domestic ? Math.round((goods - discount) * cfg.tax.domesticVat) : 0;
  return {
    channel,
    goods,
    discount,
    shipping: ship.shipping,
    customs: ship.customs,
    vat,
    total: goods - discount + ship.shipping + ship.customs + vat,
    returnDays: ship.returnDays,
    subOrders,
  };
}

/** Commission rows for one sub-order (amounts in SAR). */
export function commissionsFor(rawCfg: unknown, input: {
  channel: SalesChannel;
  goods: number;
  newCustomer: boolean;
  ambassadorTier: string;
  hasLeader: boolean;
  monthsSinceFirstDeal: number;
}): { kind: 'ambassador' | 'leader'; rate: number; amount: number }[] {
  const cfg = normalizeConfig(rawCfg);
  let rate = 0;
  if (input.channel === 'wholesale') {
    rate = input.monthsSinceFirstDeal < cfg.ambassador.wholesaleRecurringMonths ? cfg.ambassador.wholesale.value : 0;
  } else if (input.newCustomer || cfg.ambassador.retailScope === 'every_order_in_window') {
    rate = tierById(cfg, input.ambassadorTier).rate;
  }
  if (rate <= 0) return [];
  const rows: { kind: 'ambassador' | 'leader'; rate: number; amount: number }[] = [
    { kind: 'ambassador', rate, amount: Math.round(input.goods * rate) },
  ];
  if (input.hasLeader && cfg.ambassador.leaderBonus > 0) {
    rows.push({ kind: 'leader', rate: cfg.ambassador.leaderBonus, amount: Math.round(input.goods * cfg.ambassador.leaderBonus) });
  }
  return rows;
}
