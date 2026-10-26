/* Persists the shopper's orders locally (IndexedDB) so the "My Orders" page can
   show status and a tracking number right after checkout. Once a real backend
   is connected this store is replaced by server-side order records. */

import type { Order } from '@/pages/shop/types';

const DB_NAME = 'sta_orders';
const DB_VERSION = 1;
const STORE = 'orders';
const KEY = 'list';

/* Order lifecycle, in display order. A fresh order starts at "processing".
   Labels are resolved per language via the `orders.steps.*` translation keys. */
export const ORDER_STEPS = [
  { id: 'confirmed', icon: 'ri-checkbox-circle-line' },
  { id: 'processing', icon: 'ri-box-3-line' },
  { id: 'shipped', icon: 'ri-ship-2-line' },
  { id: 'transit', icon: 'ri-truck-line' },
  { id: 'delivered', icon: 'ri-home-smile-line' },
];

export function stepIndex(status: string): number {
  const i = ORDER_STEPS.findIndex((s) => s.id === status);
  return i < 0 ? 1 : i;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexeddb-unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadOrders(): Promise<Order[]> {
  try {
    const db = await openDb();
    return await new Promise<Order[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => {
        const value = req.result;
        resolve(Array.isArray(value) ? (value as Order[]) : []);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function saveOrder(order: Order): Promise<void> {
  try {
    const db = await openDb();
    const existing = await loadOrders();
    const next = [order, ...existing.filter((o) => o.id !== order.id)].slice(0, 50);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(next, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* Storage unavailable: the order simply will not be kept locally. */
  }
}

function randomChars(len: number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export function createOrderId(): string {
  const year = new Date().getFullYear();
  return `SFR-${year}-${Math.floor(10000 + Math.random() * 89999)}`;
}

export function createTracking(): string {
  const now = new Date();
  const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `SFR-${stamp}-${randomChars(6)}`;
}