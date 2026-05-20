import { useMemo } from "react";
import { isFullscreen, retrieveLaunchParams, useSignal } from "@telegram-apps/sdk-react";
import { MOBILE_TELEGRAM_PLATFORMS } from "@/telegram/init";

/** Мобильный клиент Telegram Mini App в режиме fullscreen (после requestFullscreen). */
export function useTgFullscreenMobile(): boolean {
  const fullscreen = useSignal(isFullscreen, () => false);
  const isMobileTg = useMemo(() => {
    try {
      const lp = retrieveLaunchParams();
      return MOBILE_TELEGRAM_PLATFORMS.includes(String(lp.tgWebAppPlatform ?? ""));
    } catch {
      return false;
    }
  }, []);
  return fullscreen && isMobileTg;
}
