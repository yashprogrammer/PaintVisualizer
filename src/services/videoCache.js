// src/services/videoCache.js
// Utility for caching large video blobs in the browser using IndexedDB.
// This avoids localStorage quota issues (~5 MB) while still keeping the
// video assets available offline / without additional network latency.

/*
  Public API:
  - getVideoBlob(name): Promise<Blob|null>
  - storeVideoBlob(name, blob): Promise<void>
  - getVideoObjectURL(name): Promise<string|null>  // memoised createObjectURL
*/

const DB_NAME = 'PaintVisualizerVideoCache';
const STORE_NAME = 'videos';
const DB_VERSION = 1;

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => {
      resolve(req.result);
    };
    req.onerror = () => {
      reject(req.error);
    };
  });
  return dbPromise;
}

export async function getVideoBlob(name) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(name);
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn('IndexedDB unavailable – falling back. Error:', err);
    return null;
  }
}

export async function storeVideoBlob(name, blob) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(blob, name);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch (err) {
    console.warn('Failed to store video in IndexedDB:', err);
  }
}

// In-memory memoisation of object URLs so we don't create duplicates.
const urlCache = new Map();

export async function getVideoObjectURL(name) {
  if (urlCache.has(name)) return urlCache.get(name);
  const blob = await getVideoBlob(name);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(name, url);
  return url;
}
