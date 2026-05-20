import { ADDRESS_MAP_IMAGE } from "@/constants/address";

let cachedBlobUrl: string | null = null;
let loadPromise: Promise<string> | null = null;

export function preloadAddressMap(): Promise<string> {
  if (cachedBlobUrl) return Promise.resolve(cachedBlobUrl);
  if (loadPromise) return loadPromise;
  loadPromise = fetch(ADDRESS_MAP_IMAGE)
    .then((r) => r.blob())
    .then((blob) => {
      cachedBlobUrl = URL.createObjectURL(blob);
      return cachedBlobUrl;
    })
    .catch(() => {
      loadPromise = null;
      return ADDRESS_MAP_IMAGE;
    });
  return loadPromise;
}

export function getAddressMapBlobUrl(): string | null {
  return cachedBlobUrl;
}
