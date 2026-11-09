const DB_NAME = "zarya-style-storefront";
const STORE_NAME = "product-responses";
const DB_VERSION = 1;
const PRODUCT_TTL_MS = 5 * 60 * 1000;

type CacheRecord<T> = { data: T; cachedAt: number };

const openCache = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) {
      request.result.createObjectStore(STORE_NAME);
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

async function readRecord<T>(key: string): Promise<CacheRecord<T> | undefined> {
  const database = await openCache();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result as CacheRecord<T> | undefined);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

async function writeRecord<T>(key: string, data: T): Promise<void> {
  const database = await openCache();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ data, cachedAt: Date.now() }, key);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
}

export async function getCachedProductResponse<T>(
  key: string,
  fetchFresh: () => Promise<T>,
): Promise<T> {
  if (typeof indexedDB === "undefined") return fetchFresh();

  let cached: CacheRecord<T> | undefined;
  try { cached = await readRecord<T>(key); } catch { /* private mode / quota */ }

  if (cached && Date.now() - cached.cachedAt < PRODUCT_TTL_MS) return cached.data;

  try {
    const fresh = await fetchFresh();
    void writeRecord(key, fresh).catch(() => {});
    return fresh;
  } catch (error) {
    if (cached) return cached.data;
    throw error;
  }
}
