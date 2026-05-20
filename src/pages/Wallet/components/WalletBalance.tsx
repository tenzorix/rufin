import { useTranslation } from "react-i18next";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import BalanceSkeleton from "@/components/shared/BalanceSkeleton";
import { useLumoBalanceQuery, useLumoRatesCurrentQuery } from "@/api/lumoHooks";

function formatIntegerWithSpaces(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function splitUsdParts(value: number): { int: string; frac: string } {
  const [intRaw, frac = "00"] = value.toFixed(2).split(".");
  return {
    int: intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, " "),
    frac,
  };
}

export default function WalletBalance() {
  const { t } = useTranslation();
  const { displayCurrency, assetsHidden } = usePreferencesStore();

  // Lumo интеграция — только во вкладке Wallet
  const balanceQuery = useLumoBalanceQuery({ refetchInterval: 10_000 });
  const rateQuery = useLumoRatesCurrentQuery();

  // balance: USDT, rate: RUB per USDT
  const usdtBalance = balanceQuery.data?.balance ?? 0;
  const rateRubPerUsdt = rateQuery.data?.rate ?? null;

  const rubBalance = rateRubPerUsdt != null ? Math.round(usdtBalance * rateRubPerUsdt) : 0;
  const { int: usdInt, frac: usdFrac } = splitUsdParts(usdtBalance);

  const isLoading = balanceQuery.isLoading || rateQuery.isLoading;

  return (
    <section className="flex flex-col items-center gap-1 px-6 pt-6 text-white">
      <div className="flex flex-col items-center gap-0">
        <p className="m-0 text-[13px] font-bold text-white/65">{t("wallet.balance")}</p>
        <div className="flex min-h-[1.15em] min-w-[5.5em] items-center justify-center overflow-hidden text-[48px] font-semibold leading-none tracking-tight sm:text-5xl">
          {assetsHidden || isLoading ? (
            <BalanceSkeleton size="large" />
          ) : displayCurrency === "USD" ? (
            <span className="inline-flex items-baseline whitespace-nowrap">
              <span className="text-white">$</span>
              <span className="text-white">{usdInt}</span>
              <span className="text-[#6B7280] text-[32px]">.{usdFrac}</span>
            </span>
          ) : (
            <span className="inline-flex items-baseline gap-1 whitespace-nowrap text-white">
              <span>{formatIntegerWithSpaces(rubBalance)}</span>
              <span>₽</span>
            </span>
          )}
        </div>
      </div>
      <div className="flex min-h-6 items-center justify-center">
        {assetsHidden || isLoading ? (
          <span
            className="invisible inline-flex items-center rounded-full border border-white/15 px-3 py-0.5 text-xs font-medium"
            aria-hidden
          >
            1$ = 0₽
          </span>
        ) : rateRubPerUsdt != null ? (
          <p className="m-0 inline-flex items-center rounded-[5px] border border-white/15 px-1 text-[14px] font-medium text-white">
            1$ = {rateRubPerUsdt.toFixed(2)}₽
          </p>
        ) : (
          <p className="m-0 inline-flex items-center rounded-[5px] border border-white/15 px-1 text-[14px] font-medium text-white/70">
            {t("common.loading", "Loading...")}
          </p>
        )}
      </div>
    </section>
  );
}