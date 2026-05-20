import { useEffect, useState } from "react";
import { ADDRESS_MAP_IMAGE } from "@/constants/address";
import { getAddressMapBlobUrl, preloadAddressMap } from "@/components/common/addressMapCache";

export function useAddressMapImage(): string {
  const [src, setSrc] = useState<string>(() => getAddressMapBlobUrl() ?? ADDRESS_MAP_IMAGE);

  useEffect(() => {
    const cached = getAddressMapBlobUrl();
    if (cached) {
      setSrc(cached);
      return;
    }
    preloadAddressMap().then((url) => setSrc(url));
  }, []);

  return src;
}
