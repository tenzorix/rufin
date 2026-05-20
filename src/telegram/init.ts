import {
  init,
  miniApp,
  mountMiniAppSync,
  mountBackButton,
  viewport,
  retrieveLaunchParams,
} from "@telegram-apps/sdk-react";

/** Платформы Telegram Mini App, для которых поднимаем viewport (fullscreen и safe-area). */
export const MOBILE_TELEGRAM_PLATFORMS = ["ios", "android", "android_x"];

export async function initTelegram() : Promise<void> {
  const callReady = () => {
    try {
      if (miniApp.ready.isAvailable()) {
        miniApp.ready();
      }
    } catch (e) {
      console.error("[Telegram] miniApp.ready failed:", e);
    }
  };

  try {
    init();
  } catch (e) {
    console.error("[Telegram] init failed:", e);
  }

  try {
    if (mountBackButton.isAvailable()) {
      mountBackButton();
    }
  } catch (e) {
    console.error("[Telegram] mountBackButton failed:", e);
  }

  try {
    if (mountMiniAppSync.isAvailable()) {
      mountMiniAppSync();
      miniApp.setHeaderColor("#080c18");
      miniApp.setBottomBarColor("#080c18");
      miniApp.setBackgroundColor("#080c18");
    }
  } catch (e) {
    console.error("[Telegram] miniApp setup failed:", e);
  }

  let platform = "unknown";
  try {
    const lp = retrieveLaunchParams();
    platform = (lp.tgWebAppPlatform as string) ?? "unknown";
  } catch (e) {
    console.error("[Telegram] launchParams failed:", e);
  }

  if (MOBILE_TELEGRAM_PLATFORMS.includes(platform)) {
    try {
      await viewport.mount();
      viewport.bindCssVars();
      await viewport.requestFullscreen();
      await new Promise(resolve => setTimeout(resolve, 150));
  
    } catch (e) {
      console.error("[Telegram] viewport setup failed:", e);
    }
  }
  callReady();
}
