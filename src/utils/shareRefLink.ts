import { shareURL } from "@telegram-apps/sdk-react";
import i18n from "@/i18n";
import { telegramBotDeepLink } from "@/constants/env";

export function shareRefLink(refCode: string) {
  const url = telegramBotDeepLink(refCode);
  const text = i18n.t("referral.shareText");

  if (shareURL.isAvailable()) {
    shareURL(url, text);
  } else {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      "_blank",
    );
  }
}
