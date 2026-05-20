import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { getDateLocale } from "@/i18n";
import { useExchangeStore } from "@/store/useExchangeStore";
import { useRatesQuery } from "@/api/hooks";
import { MAX_RUB_AMOUNT, MIN_RUB_AMOUNT } from "@/constants/exchange";
import {
  calculateFromAmountForTargetTo,
  calculateRubResult,
  calculateToAmount,
  getRateByDirection,
  isEmptyOrZeroAmount,
  parseAmount,
} from "@/utils/exchangeCalculations";

type UseExchangeFormOptions = {
  fromWithdraw?: boolean;
  sellPreviewCommissionUsd?: number;
};

export function useExchangeForm(options?: UseExchangeFormOptions) {
  const sellPreviewUsd = options?.sellPreviewCommissionUsd;
  const { t, i18n } = useTranslation();
  const fromAmount = useExchangeStore((s) => s.fromAmount);
  const direction = useExchangeStore((s) => s.direction);
  const buyRate = useExchangeStore((s) => s.buyRate);
  const sellRate = useExchangeStore((s) => s.sellRate);
  const setFromAmount = useExchangeStore((s) => s.setFromAmount);
  const setDirection = useExchangeStore((s) => s.setDirection);
  const setRates = useExchangeStore((s) => s.setRates);
  const submit = useExchangeStore((s) => s.submit);
  const swap = useExchangeStore((s) => s.swap);
  const navigate = useNavigate();

  const { data: rates } = useRatesQuery();

  useEffect(() => {
    if (rates) {
      const buy = parseFloat(rates.buy);
      const sell = parseFloat(rates.sell);
      if (Number.isFinite(buy) && Number.isFinite(sell)) {
        setRates(sell, buy);
      }
    }
  }, [rates, setRates]);

  const isBuy = direction === "BUY";
  const activeRate = getRateByDirection(direction, buyRate, sellRate);

  const parsedFrom = useMemo(() => {
    return parseAmount(fromAmount);
  }, [fromAmount]);

  const toAmount = useMemo(() => {
    if (parsedFrom === null) return "";
    return calculateToAmount({
      amount: parsedFrom,
      direction,
      buyRate,
      sellRate,
      sellCommissionUsd: sellPreviewUsd,
    });
  }, [parsedFrom, direction, buyRate, sellRate, sellPreviewUsd]);

  const rubResult = useMemo(() => {
    if (parsedFrom === null) return null;
    return calculateRubResult({
      amount: parsedFrom,
      direction,
      buyRate,
      sellRate,
      sellCommissionUsd: sellPreviewUsd,
    });
  }, [parsedFrom, direction, buyRate, sellRate, sellPreviewUsd]);

  const minRubOk = useMemo(() => {
    if (parsedFrom === null || parsedFrom === 0) return true;
    if (isBuy) return parsedFrom >= MIN_RUB_AMOUNT;
    return (rubResult ?? 0) >= MIN_RUB_AMOUNT;
  }, [parsedFrom, isBuy, rubResult]);

  const maxRubOk = useMemo(() => {
    if (parsedFrom === null || parsedFrom === 0) return true;
    if (isBuy) return parsedFrom <= MAX_RUB_AMOUNT;
    return (rubResult ?? 0) <= MAX_RUB_AMOUNT;
  }, [parsedFrom, isBuy, rubResult]);

  const minRubError = useMemo(() => {
    if (isEmptyOrZeroAmount(parsedFrom)) return null;
    if (minRubOk) return null;
    const amount = MIN_RUB_AMOUNT.toLocaleString(getDateLocale());
    return isBuy
      ? t("exchange.minBuyRub", { amount })
      : t("exchange.minSellRub", { amount });
  }, [parsedFrom, minRubOk, isBuy, t, i18n.language]);

  const maxRubError = useMemo(() => {
    if (isEmptyOrZeroAmount(parsedFrom)) return null;
    if (!maxRubOk) {
      const amount = MAX_RUB_AMOUNT.toLocaleString(getDateLocale());
      return isBuy
        ? t("exchange.maxBuyRub", { amount })
        : t("exchange.maxSellRub", { amount });
    }
    return null;
  }, [parsedFrom, maxRubOk, isBuy, t, i18n.language]);

  const rubLimitError = minRubError || maxRubError;

  const syncFromForTargetToAmount = useCallback(
    (raw: string) => {
      const trimmed = raw.replace(/\s/g, "");
      if (trimmed === "") {
        setFromAmount("");
        return;
      }
      if (trimmed === ".") return;

      const parsedTo = parseAmount(trimmed);
      if (parsedTo === null || parsedTo < 0) return;

      const rate = getRateByDirection(direction, buyRate, sellRate);
      if (rate <= 0) return;

      const fromStr = calculateFromAmountForTargetTo(
        parsedTo,
        direction,
        buyRate,
        sellRate,
        sellPreviewUsd
      );
      if (fromStr !== null) setFromAmount(fromStr);
    },
    [direction, buyRate, sellRate, setFromAmount, sellPreviewUsd]
  );

  const disabled = isEmptyOrZeroAmount(parsedFrom) || !minRubOk || !maxRubOk;

  const onSubmit = () => {
    submit({ fromWithdraw: options?.fromWithdraw });
    navigate("/exchange-checkout");
  };

  return {
    fromAmount,
    setFromAmount,
    direction,
    setDirection,
    toAmount,
    isBuy,
    fromCurrency: isBuy ? "RUB" : "USDT",
    toCurrency: isBuy ? "USDT" : "RUB",
    label: isBuy ? t("exchange.buyLabel") : t("exchange.sellLabel"),
    ratesLoading: activeRate === 0,
    displayRate: activeRate > 0 ? `1$ = ${activeRate.toFixed(2)}₽` : "",
    disabled: disabled || activeRate === 0,
    rubLimitError,
    onSubmit,
    handleSwap: swap,
    syncFromForTargetToAmount,
  };
}
