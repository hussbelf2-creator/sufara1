/* Shipment tracking model for the export storefront.
   The checkpoints a shipment passes through depend on the chosen shipping
   method (sea lane vs. air lane). Until a live carrier feed is connected the
   milestones are derived deterministically from the order's own status, so the
   tracking always reflects an order that actually exists. Milestone labels and
   the lane hubs are resolved in the shopper's current language. */

import i18n from '@/i18n';
import type { Order } from '@/pages/shop/types';

const tl = (key: string, opts?: Record<string, unknown>): string => String(i18n.t(key, opts));

export interface TrackPoint {
  id: string;
  label: string;
  detail: string;
  icon: string;
  /** progress ratio (0..1) at which this milestone is reached */
  reach: number;
  /** hours after order creation, used to timestamp the milestone */
  offsetHours: number;
}

interface RawPoint {
  id: string;
  icon: string;
  reach: number;
  offsetHours: number;
}

/* Sea lane: Jeddah Islamic Port → destination sea port. */
const SEA_POINTS: RawPoint[] = [
  { id: 'confirmed', icon: 'ri-checkbox-circle-line', reach: 0, offsetHours: 0 },
  { id: 'consolidated', icon: 'ri-box-3-line', reach: 0.2, offsetHours: 24 },
  { id: 'export-clear', icon: 'ri-file-shield-2-line', reach: 0.36, offsetHours: 48 },
  { id: 'loaded', icon: 'ri-ship-2-line', reach: 0.52, offsetHours: 72 },
  { id: 'sea', icon: 'ri-sailboat-line', reach: 0.74, offsetHours: 264 },
  { id: 'arrived', icon: 'ri-anchor-line', reach: 0.9, offsetHours: 552 },
  { id: 'delivered', icon: 'ri-home-smile-line', reach: 1, offsetHours: 624 },
];

/* Air lane: King Abdulaziz Airport → destination airport. */
const AIR_POINTS: RawPoint[] = [
  { id: 'confirmed', icon: 'ri-checkbox-circle-line', reach: 0, offsetHours: 0 },
  { id: 'consolidated', icon: 'ri-box-3-line', reach: 0.2, offsetHours: 12 },
  { id: 'export-clear', icon: 'ri-file-shield-2-line', reach: 0.36, offsetHours: 24 },
  { id: 'loaded', icon: 'ri-flight-takeoff-line', reach: 0.56, offsetHours: 36 },
  { id: 'air', icon: 'ri-flight-takeoff-line', reach: 0.76, offsetHours: 48 },
  { id: 'arrived', icon: 'ri-plane-line', reach: 0.9, offsetHours: 96 },
  { id: 'delivered', icon: 'ri-home-smile-line', reach: 1, offsetHours: 144 },
];

const STATUS_PROGRESS: Record<string, number> = {
  confirmed: 0.08,
  processing: 0.28,
  shipped: 0.56,
  transit: 0.76,
  delivered: 1,
};

/* Canonical order lifecycle, in display order. */
const STATUS_ORDER = ['confirmed', 'processing', 'shipped', 'transit', 'delivered'];

/* Returns whichever of the two statuses is further along the lifecycle, so a
   live shipment update from the admin desk never regresses an order and can
   only ever advance it. */
export function advanceStatus(current: string, next: string): string {
  const a = STATUS_ORDER.indexOf(current);
  const b = STATUS_ORDER.indexOf(next);
  if (a < 0) return b < 0 ? current : next;
  if (b < 0) return current;
  return b > a ? next : current;
}

export function isAir(method: string): boolean {
  return /جوي|air|fly/i.test(method);
}

function localize(raw: RawPoint[], lane: 'sea' | 'air'): TrackPoint[] {
  return raw.map((p) => ({
    ...p,
    label: tl(`orders.track.points.${lane}.${p.id}.label`),
    detail: tl(`orders.track.points.${lane}.${p.id}.detail`),
  }));
}

export function trackPoints(method: string): TrackPoint[] {
  return isAir(method) ? localize(AIR_POINTS, 'air') : localize(SEA_POINTS, 'sea');
}

export function orderProgress(order: Order): number {
  const ratio = STATUS_PROGRESS[order.status];
  return typeof ratio === 'number' ? ratio : 0.28;
}

export interface TrackState extends TrackPoint {
  done: boolean;
  current: boolean;
  at: number;
}

/* Resolves each milestone to a done / upcoming state plus its timestamp. */
export function trackState(order: Order): { points: TrackState[]; progress: number } {
  const progress = orderProgress(order);
  const points: TrackState[] = trackPoints(order.shippingMethod).map((p) => ({
    ...p,
    done: progress >= p.reach + 0.001,
    current: false,
    at: order.createdAt + p.offsetHours * 3600 * 1000,
  }));

  let lastDone = -1;
  points.forEach((p, i) => {
    if (p.done) lastDone = i;
  });
  if (lastDone >= 0) points[lastDone].current = true;

  return { points, progress };
}

export interface Lane {
  originName: string;
  originHub: string;
  originIcon: string;
  destName: string;
  destHub: string;
}

/* Origin hub (always Jeddah) paired with the destination hub for the lane. */
export function laneOf(order: Order): Lane {
  const destName = tl('orders.track.destCity', { city: order.city, country: order.country });
  if (isAir(order.shippingMethod)) {
    return {
      originName: tl('orders.track.originCity'),
      originHub: tl('orders.track.airHub'),
      originIcon: 'ri-flight-takeoff-line',
      destName,
      destHub: tl('orders.track.destAirport', { city: order.city }),
    };
  }
  return {
    originName: tl('orders.track.originCity'),
    originHub: tl('orders.track.seaHub'),
    originIcon: 'ri-ship-2-line',
    destName,
    destHub: order.port,
  };
}

/* Estimated number of cartons for the shipping documents. */
export function cartonCount(order: Order): number {
  return Math.max(1, Math.ceil(order.count / 20));
}