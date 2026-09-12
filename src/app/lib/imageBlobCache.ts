const DB_NAME = "zarya-style-media";
const STORE_NAME = "image-blobs";
const DB_VERSION = 1;
const IMAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type ImageRecord = { blob: Blob; cachedAt: number };

const openImageCache = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const readBlob = async (key: string): Promise<ImageRecord | Blob | undefined> => {
  const database = await openImageCache();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result as ImageRecord | Blob | undefined);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
};

const writeBlob = async (key: string, blob: Blob): Promise<void> => {
  const database = await openImageCache();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({ blob, cachedAt: Date.now() }, key);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
};

export async function getCachedImageBlob(url: string): Promise<Blob> {
  if (typeof indexedDB === "undefined") throw new Error("IndexedDB unavailable");
  const cached = await readBlob(url);
  if (cached instanceof Blob) return cached;
  if (cached && Date.now() - cached.cachedAt < IMAGE_TTL_MS) return cached.blob;
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Image request failed: ${response.status}`);
  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) throw new Error("Response is not an image");
  await writeBlob(url, blob);
  return blob;
}
