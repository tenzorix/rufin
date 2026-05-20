import { useCallback, useState } from "react";
import {
  openQrScanner,
  closeQrScanner,
} from "@telegram-apps/sdk";

interface UseQrScannerOptions {
  text?: string;
  onScanned?: (data: string) => void;
}

export function useQrScanner(options: UseQrScannerOptions = {}) {
  const [scanning, setScanning] = useState(false);

  const scan = useCallback(async () => {
    try {
      if (!openQrScanner.isAvailable()) return;
    } catch {
      return;
    }

    setScanning(true);
    try {
      const result = await openQrScanner({ text: options.text });
      if (result) {
        options.onScanned?.(result);
      }
      return result;
    } catch (e) {
      console.error("[useQrScanner]", e);
    } finally {
      setScanning(false);
    }
  }, [options.text, options.onScanned]);

  const close = useCallback(() => {
    try {
      if (closeQrScanner.isAvailable()) {
        closeQrScanner();
      }
    } catch {}
    setScanning(false);
  }, []);

  return { scan, close, scanning };
}
