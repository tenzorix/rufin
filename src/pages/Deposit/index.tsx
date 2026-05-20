import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "@/components/common/QRCode";
import PageHeader from "@/components/shared/PageHeader";
import { useBackButton } from "@/hooks/useBackButton";
import { DEPOSIT_QR_LOGO, DEPOSIT_QR_LOGO_IMAGE_SIZE } from "@/constants/deposit";
import { useLumoWalletQuery } from "@/api/lumoHooks";
import { toast } from "@/store/useToastStore";

export default function Deposit() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  useBackButton();

  // Lumo deposit address
  const walletQuery = useLumoWalletQuery();
  const address = walletQuery.data?.address ?? "";

  const canCopy = address.length > 0 && !walletQuery.isLoading;

  const addressLabel = useMemo(() => {
    if (walletQuery.isLoading) return t("common.loadingEllipsis");
    if (walletQuery.isError) return "—";
    return address || "—";
  }, [address, t, walletQuery.isError, walletQuery.isLoading]);

  const handleCopy = async () => {
    if (!canCopy) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать адрес");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col pt-4 pb-4">
      <PageHeader title={t("deposit.title")} />
      <div className="w-[280px] max-w-md mx-auto">
        <p className="mb-4 text-center text-sm font-semibold text-white">
          {t("deposit.warning")}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex mb-4 w-[250px] max-w-md flex-col items-center gap-2 rounded-3xl bg-[#171a27] p-6">
          <div className="flex flex-col items-center gap-4 border-b border-white/10 pb-4">
            <QRCode
              value={address || "loading"}
              logoImage={DEPOSIT_QR_LOGO}
              logoImageSize={DEPOSIT_QR_LOGO_IMAGE_SIZE}
              size={200}
            />
          </div>

          <span className="text-sm text-white/60">{t("deposit.addressHint")}</span>
          <p className="text-center w-[154px] font-mono text-sm text-white break-all">
            {addressLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          disabled={!canCopy}
          className="flex max-w-fit px-4 items-center justify-center gap-2 rounded-[24px] bg-white py-2 text-sm font-bold text-[#080C18] transition-colors hover:bg-white/90 disabled:opacity-60 [-webkit-tap-highlight-color:transparent]"
        >
          {copied ? t("common.copied") : t("common.copy")}
        </button>

        {walletQuery.isError && (
          <p className="mt-3 text-center text-xs text-red-200/80">
            Не удалось загрузить адрес. Обнови страницу или попробуй позже.
          </p>
        )}
      </div>

      <div className="mt-auto space-y-1 pt-4 text-center text-sm text-white/40">
        <p>{t("deposit.minDeposit")}</p>
        <p>{t("deposit.fee")}</p>
      </div>
    </div>
  );
}
