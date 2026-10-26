import { useEffect, useState } from 'react';

/* The bridge between the admin shipping desk and the buyer's tracking page.
   When an admin schedules a pickup or confirms a delivery, the shipment's real
   tracking number is written here. The buyer's order-tracking page reads the
   same record (keyed by the order's tracking number) and shows the live carrier
   and status. Persisted in localStorage and broadcast with a window event so
   both sides stay in sync in the same tab. Moves server-side once a backend is
   connected. */

export interface FeedEvent {
  at: number;
  label: string;
}

export interface ShipmentRecord {
  tracking: string;
  carrier: string;
  statusLabel: string;
  /** Canonical order status id this shipment implies: processing | shipped | transit | delivered */
  orderStatus: string;
  events: FeedEvent[];
  updatedAt: number;
}

export type ShipmentFeed = Record<string, ShipmentRecord>;

export interface ShipmentUpdate {
  tracking: string;
  carrier: string;
  statusLabel: string;
  orderStatus: string;
  event: string;
}

const STORAGE_KEY = 'sta-shipment-feed';
const EVT = 'sta-shipment-feed-change';
const EVENT_LIMIT = 40;

export function readShipmentFeed(): ShipmentFeed {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ShipmentFeed;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeFeed(feed: ShipmentFeed): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feed));
  } catch {
    /* storage may be unavailable — the update will not persist */
  }
  window.dispatchEvent(new Event(EVT));
}

/* Appends a milestone to the shipment's live record, preserving the history. */
export function pushShipmentRecord(update: ShipmentUpdate): void {
  if (!update.tracking) return;
  const feed = readShipmentFeed();
  const prev = feed[update.tracking];
  const now = Date.now();
  const record: ShipmentRecord = {
    tracking: update.tracking,
    carrier: update.carrier,
    statusLabel: update.statusLabel,
    orderStatus: update.orderStatus,
    updatedAt: now,
    events: [...(prev?.events ?? []), { at: now, label: update.event }].slice(-EVENT_LIMIT),
  };
  writeFeed({ ...feed, [update.tracking]: record });
}

export function useShipmentFeed(): ShipmentFeed {
  const [feed, setFeed] = useState<ShipmentFeed>(readShipmentFeed);

  useEffect(() => {
    const sync = () => setFeed(readShipmentFeed());
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return feed;
}