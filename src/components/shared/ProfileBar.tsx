import { useTranslation } from "react-i18next";
import Avatar from "./Avatar";
import { useProfileQuery } from "@/api/hooks";
import { useAuthStore } from "@/store/useAuthStore";
import { useLumoWalletQuery } from "@/api/lumoHooks";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { Check, Copy } from "lucide-react";
import { useMemo, useState } from "react";

export default function ProfileBar() {
  const { t } = useTranslation();
  const telegramUserId = useAuthStore((s) => s.telegramUserId);
  const { isLoading: profileLoading } = useProfileQuery();
  const walletQuery = useLumoWalletQuery();
  const [copied, setCopied] = useState(false);

  const walletAddress = walletQuery.data?.address ?? null;

  const shortWalletAddress = useMemo(() => {
    if (!walletAddress) return "—";
    if (walletAddress.length <= 12) return walletAddress;
    return `${walletAddress.slice(0, 5)}...${walletAddress.slice(-5)}`;
  }, [walletAddress]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback ignored
    }
  };
  let initFirstName: string | undefined;
  let initLastName: string | undefined;
  let initPhotoUrl: string | undefined;
  try {
    const lp = retrieveLaunchParams();
    const userFromInit =
      lp?.tgWebAppData?.user ||
      // @ts-expect-error: совместимость с разными версиями SDK
      lp?.initDataUnsafe?.user ||
      // @ts-expect-error: совместимость с разными версиями SDK
      lp?.initData?.user;

    initFirstName = userFromInit?.first_name;
    initLastName = userFromInit?.last_name;
    initPhotoUrl = userFromInit?.photo_url;
  } catch {
    // игнорируем, используем fallback ниже
  }

  const nameFromInit = [initFirstName, initLastName].filter(Boolean).join(" ").trim();

  const username =
    nameFromInit ||
    (telegramUserId ? `ID ${telegramUserId}` : t("profileBar.profileFallback"));
  const avatarUrl = initPhotoUrl;

  return (
    <div className="flex items-center gap-3">
      <Avatar username={username} avatarUrl={avatarUrl} className="shrink-0" />

      <div className="flex min-w-0 flex-col gap-0" aria-busy={profileLoading || walletQuery.isLoading}>
        {profileLoading || walletQuery.isLoading ? (
          <>
            <div className="flex h-[18px] items-center">
              <span className="h-3.5 w-24 rounded-md bg-white/15 animate-pulse" aria-hidden />
            </div>
            <div className="-mt-1 flex h-5 items-center justify-between gap-2">
              <span className="h-3 w-20 rounded-md bg-white/10 animate-pulse" aria-hidden />
              <button
                type="button"
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-white/70 transition-colors"
                aria-label={t("profileBar.copyId")}
                onClick={handleCopy}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-[18px] items-center">
              <span className="truncate text-[13px] font-semibold leading-none text-white">{username}</span>
            </div>
            <div className="-mt-1 flex h-5 items-center justify-between gap-2">
              <span className="truncate text-[13px] leading-none text-white/60">{shortWalletAddress}</span>
              <button
                type="button"
                disabled={!walletAddress}
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-white/70 transition-colors disabled:opacity-50"
                aria-label={t("common.copy")}
                onClick={handleCopy}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

