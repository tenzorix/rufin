import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { getDateLocale } from "@/i18n";
import { WalletIcon } from "@/assets/icons";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import BalanceSkeleton from "@/components/shared/BalanceSkeleton";

type WalletBalanceBlockProps = {
  balance?: string;
  address?: string;
  forceCurrency?: "USD";
};

const USD_RATE = 77.3;

export default function WalletBalanceBlock({
  balance = "10 000.20",
  address = "7Gk9...iye",
  forceCurrency,
}: WalletBalanceBlockProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { displayCurrency, assetsHidden } = usePreferencesStore();

  const usdValue = parseFloat(balance.replace(/\s/g, "")) || 0;
  const rubValue = Math.round(usdValue * USD_RATE);

  const effectiveCurrency = forceCurrency ?? displayCurrency;
  const displayText =
    effectiveCurrency === "USD"
      ? balance
      : rubValue.toLocaleString(getDateLocale());
  const symbol = effectiveCurrency === "USD" ? "$" : "₽";

  const [whole, cents] = displayText.includes(".")
    ? displayText.split(".")
    : [displayText, ""];

  return (
    <div className="flex w-full items-center gap-2 rounded-2xl mt-8 py-4 pb-0">
      <div className="flex h-[41px] w-[41px] shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
        <WalletIcon />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0">
        <div className="flex min-h-[1.2em] min-w-[4.5em] items-center leading-tight font-semibold text-white text-lg">
          {assetsHidden ? (
            <BalanceSkeleton size="small" />
          ) : (
            <>
              <span>{symbol} </span>
              <span className="text-[18px]">{whole}</span>
              {cents && <span className="text-white/60 text-[18px]">.{cents}</span>}
            </>
          )}
        </div>
        <div className="-mt-0.5 truncate text-[13px] font-bold leading-tight text-white/60">{address}</div>
      </div>
      <button
        type="button"
        onClick={() => navigate("/deposit")}
        className="shrink-0 rounded-3xl bg-[#30333e] px-4 py-2 text-[12px] font-bold text-white transition-colors [-webkit-tap-highlight-color:transparent]"
      >
        {t("wallet.deposit")}
      </button>
    </div>
  );
}
