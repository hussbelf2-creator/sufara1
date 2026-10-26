/* Persists the shopper's cart locally in the browser (IndexedDB).
   Only the minimal { id, qty } pairs are stored — product details are always
   resolved fresh, so prices and stock can never go stale in storage. */

export interface CartLine {
  id: string;
  qty: number;
}

const DB_NAME = 'sta_store';
const DB_VERSION = 1;
const STORE = 'cart';
const KEY = 'lines';

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

export async function loadCart(): Promise<CartLine[]> {
  try {
    const db = await openDb();
    return await new Promise<CartLine[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => {
        const value = req.result;
        resolve(Array.isArray(value) ? (value as CartLine[]) : []);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function saveCart(lines: CartLine[]): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(lines, KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* Storage is unavailable: the cart simply will not survive a page reload. */
  }
}