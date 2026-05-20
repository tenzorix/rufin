import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import QRCode from "@/components/common/QRCode";
import PageHeader from "@/components/shared/PageHeader";
import { useBackButton } from "@/hooks/useBackButton";
import { shareRefLink } from "@/utils/shareRefLink";
import { TELEGRAM_BOT_USERNAME, telegramBotDeepLink } from "@/constants/env";

export default function RefShare() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("code") ?? "H4KS9B4";
  const shareUrl = telegramBotDeepLink(`ref_${refCode}`);

  useBackButton();

  return (
    <div className="mx-auto relative flex w-full max-w-md flex-1 flex-col pt-4 pb-4">
      <div
        className="pointer-events-none fixed inset-0 z-10 rounded-3xl"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(30, 80, 180, 0.35) 0%, transparent 90%)'
        }}
      />
      <PageHeader title={t("referral.qrTitle")} />
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6">
        <div
          className="relative flex flex-col items-center gap-4 rounded-3xl p-6 overflow-visible bg-white/6"
        >

          <QRCode value={shareUrl} logoImage="/icons/rufin.png" size={240} />
          <span className="text-2xl font-medium text-white">@{TELEGRAM_BOT_USERNAME}</span>
        </div>
      </div>

      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={() => shareRefLink(refCode)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-bold text-[#080C18] transition-colors [-webkit-tap-highlight-color:transparent]"
        >
          
          {t("referral.share")}
        </button>
      </div>
    </div>
  );
}
