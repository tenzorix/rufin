import { useMemo, useRef, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useExchangeForm } from "@/hooks/useExchangeForm";
import {
  formatRubAmount,
  formatUsdAmount,
  parseAmount,
} from "@/utils/exchangeCalculations";
import { CURRENCY_UI, type CurrencyCode } from "@/constants/currencyUi";
import { RubleIcon } from "@/components/shared/RubleIcon";
import {
  countDigitsRight,
  formatAmountForUi,
  getCaretIndexByDigitsRight,
  sanitizeExchangeInput,
} from "@/utils/exchangeInput";
import { useDelayedFlag } from "@/hooks/useDelayedFlag";

type ExchangeWidgetProps = {
  showSwapButton?: boolean;
  showMaxButton?: boolean;
  maxAmount?: string;
  withdrawGrossUsdMode?: boolean;
  withdrawAvailableUsd?: number;
  withdrawFeeUsd?: number;
  /** С страницы «Вывод» — синхронизирует расчёты с useExchangeForm родителя */
  fromWithdraw?: boolean;
  sellPreviewCommissionUsd?: number;
};

export default function ExchangeWidget({
  showSwapButton = true,
  showMaxButton = false,
  maxAmount = "",
  withdrawGrossUsdMode = false,
  withdrawAvailableUsd,
  withdrawFeeUsd,
  fromWithdraw = false,
  sellPreviewCommissionUsd,
}: ExchangeWidgetProps) {
  const { t } = useTranslation();
  const withdrawFee =
    withdrawGrossUsdMode
      ? withdrawFeeUsd !== undefined && withdrawFeeUsd !== null
        ? withdrawFeeUsd
        : 3
      : undefined;
  const sellPreviewUsd =
    sellPreviewCommissionUsd ??
    (withdrawGrossUsdMode ? 0 : undefined);
  const {
    fromAmount,
    setFromAmount,
    fromCurrency,
    toCurrency,
    toAmount,
    label,
    displayRate,
    ratesLoading,
    isBuy,
    rubLimitError,
    handleSwap,
    syncFromForTargetToAmount,
  } = useExchangeForm({ fromWithdraw, sellPreviewCommissionUsd: sellPreviewUsd });

  const fromInputRef = useRef<HTMLInputElement | null>(null);
  const toInputRef = useRef<HTMLInputElement | null>(null);
  /** Последнее сырое значение поля «получите»; обновляется синхронно в onChange (state может отставать при blur → клик по кнопке). */
  const toFieldLatestRawRef = useRef("");
  const [fromGrossFocused, setFromGrossFocused] = useState(false);
  const [fromGrossDraft, setFromGrossDraft] = useState("");
  const [toFieldFocused, setToFieldFocused] = useState(false);
  const [toInputRaw, setToInputRaw] = useState("");

  const parsedFrom = parseAmount(fromAmount);

  const grossFromStoredNet = useMemo(() => {
    if (!withdrawGrossUsdMode || withdrawFee == null) return "";
    if (parsedFrom === null || parsedFrom <= 0) return "";
    return formatUsdAmount(parsedFrom + withdrawFee);
  }, [withdrawGrossUsdMode, withdrawFee, parsedFrom]);

  const fromFieldRaw =
    withdrawGrossUsdMode && withdrawFee != null
      ? fromGrossFocused
        ? fromGrossDraft
        : fromAmount === ""
          ? ""
          : grossFromStoredNet
      : fromAmount;

  const fromAmountUi = formatAmountForUi(fromFieldRaw);
  const toDisplayRaw = toFieldFocused ? toInputRaw : toAmount || "";
  /** Без группировки в фокусе — пробелы в controlled input дают рассинхрон и пропажу нулей. */
  const toAmountUi = toFieldFocused
    ? (toDisplayRaw || "")
    : formatAmountForUi(toDisplayRaw || "");

  const balanceNum = useMemo(() => {
    if (!showMaxButton || withdrawGrossUsdMode) return null;
    if (!maxAmount) return null;
    const n = parseFloat(maxAmount.replace(/\s/g, ""));
    return Number.isFinite(n) ? n : null;
  }, [showMaxButton, maxAmount, withdrawGrossUsdMode]);

  const draftGrossParsed = useMemo(() => {
    if (!fromGrossFocused || withdrawFee == null) return null;
    const trimmed = sanitizeExchangeInput(fromGrossDraft).replace(/\s/g, "");
    if (trimmed === "" || trimmed === ".") return null;
    return parseAmount(trimmed);
  }, [fromGrossFocused, withdrawFee, fromGrossDraft]);

  const insufficientFunds = useMemo(() => {
    if (withdrawGrossUsdMode && withdrawAvailableUsd != null) {
      let gross: number | null = null;
      if (fromGrossFocused && draftGrossParsed !== null) {
        gross = draftGrossParsed;
      } else if (!fromGrossFocused && parsedFrom !== null && parsedFrom > 0 && withdrawFee != null) {
        gross = parsedFrom + withdrawFee;
      }
      return gross !== null && gross > withdrawAvailableUsd + 1e-9;
    }
    return balanceNum != null && parsedFrom != null && parsedFrom > 0 && parsedFrom > balanceNum;
  }, [
    withdrawGrossUsdMode,
    withdrawAvailableUsd,
    fromGrossFocused,
    draftGrossParsed,
    parsedFrom,
    withdrawFee,
    balanceNum,
  ]);
  const showRubLimitError = useDelayedFlag(Boolean(rubLimitError), 1000, fromAmount);
  const fromCurrencyUi = CURRENCY_UI[fromCurrency as CurrencyCode];
  const toCurrencyUi = CURRENCY_UI[toCurrency as CurrencyCode];

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const prevUi = el.value;
    const selectionStart = el.selectionStart ?? prevUi.length;
    const digitsRight = countDigitsRight(prevUi, selectionStart);

    const nextRaw = sanitizeExchangeInput(prevUi);

    setToFieldFocused(false);
    setToInputRaw("");
    toFieldLatestRawRef.current = "";

    if (
      withdrawGrossUsdMode &&
      withdrawFee != null &&
      withdrawAvailableUsd != null
    ) {
      setFromGrossDraft(nextRaw);

      const trimmed = nextRaw.replace(/\s/g, "");
      if (trimmed === "") {
        setFromAmount("");
      } else if (trimmed !== ".") {
        const g = parseAmount(trimmed);
        if (g !== null && g >= 0) {
          if (g > withdrawFee + 1e-12) {
            const net = g - withdrawFee;
            setFromAmount(formatUsdAmount(net));
          } else {
            setFromAmount("");
          }
        }
      }

      queueMicrotask(() => {
        const input = fromInputRef.current;
        if (!input) return;
        const nextUi = input.value;
        const idx = getCaretIndexByDigitsRight(nextUi, digitsRight);
        input.setSelectionRange(idx, idx);
      });
      return;
    }

    setFromAmount(nextRaw);

    queueMicrotask(() => {
      const input = fromInputRef.current;
      if (!input) return;
      const nextUi = input.value;
      const idx = getCaretIndexByDigitsRight(nextUi, digitsRight);

      input.setSelectionRange(idx, idx);
    });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const prevUi = el.value;
    const selectionStart = el.selectionStart ?? prevUi.length;
    const digitsRight = countDigitsRight(prevUi, selectionStart);

    const nextRaw = sanitizeExchangeInput(prevUi);
    const normalized = nextRaw.replace(/\s/g, "");
    toFieldLatestRawRef.current = normalized;
    setToInputRaw(nextRaw);
    syncFromForTargetToAmount(nextRaw);

    queueMicrotask(() => {
      const input = toInputRef.current;
      if (!input) return;
      const nextUi = input.value;
      const idx = getCaretIndexByDigitsRight(nextUi, digitsRight);
      input.setSelectionRange(idx, idx);
    });
  };

  const handleSwapClick = () => {
    setFromGrossFocused(false);
    setFromGrossDraft("");
    setToFieldFocused(false);
    setToInputRaw("");
    toFieldLatestRawRef.current = "";
    handleSwap();
  };

  const handleMaxClick = () => {
    setToFieldFocused(false);
    setToInputRaw("");
    toFieldLatestRawRef.current = "";
    setFromGrossFocused(false);
    setFromGrossDraft("");

    if (
      withdrawGrossUsdMode &&
      withdrawAvailableUsd != null &&
      withdrawFee != null
    ) {
      const net = Math.max(0, withdrawAvailableUsd - withdrawFee);
      setFromAmount(net > 0 ? formatUsdAmount(net) : "");
      return;
    }

    setFromAmount(maxAmount.replace(/\s/g, "") || "");
  };

  return (
    <div className="mb-3 space-y-3">
      <div className="overflow-hidden rounded-2xl bg-[#ffffff0a]">
        {/* Вы платите */}
        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-md font-semibold text-white ${fromCurrencyUi.badgeClass}`}
              >
                {fromCurrency === "RUB" ? (
                  <RubleIcon className="size-6 shrink-0" />
                ) : (
                  fromCurrencyUi.icon
                )}
              </div>
              <span className="text-base font-bold text-white">{t("exchange.youPay")}</span>
            </div>
            {showMaxButton && (
              <button
                type="button"
                onClick={handleMaxClick}
                className="text-sm font-medium text-white transition-colors [-webkit-tap-highlight-color:transparent]"
              >
                {t("exchange.max")}
              </button>
            )}
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <input
              type="text"
              inputMode="decimal"
              ref={fromInputRef}
              value={fromAmountUi}
              onChange={handleFromChange}
              onFocus={() => {
                setToFieldFocused(false);
                setToInputRaw("");
                toFieldLatestRawRef.current = "";
                if (withdrawGrossUsdMode && withdrawFee != null) {
                  setFromGrossFocused(true);
                  setFromGrossDraft(grossFromStoredNet || "");
                }
              }}
              onBlur={() => {
                if (withdrawGrossUsdMode) {
                  setFromGrossFocused(false);
                  setFromGrossDraft("");
                  const net = parseAmount(fromAmount);
                  if (net !== null && net > 0) {
                    setFromAmount(formatUsdAmount(net));
                  }
                  return;
                }
                const p = parseAmount(fromAmount);
                if (p === null || fromAmount === "") return;
                if (fromCurrency === "RUB") {
                  setFromAmount(formatRubAmount(p));
                } else {
                  setFromAmount(formatUsdAmount(p));
                }
              }}
              disabled={ratesLoading}
              placeholder="0"
              className={`min-w-0 flex-1 bg-transparent text-[40px] font-bold outline-none placeholder:text-white/60 ${
                insufficientFunds ? "text-red-400" : "text-white"
              } ${ratesLoading ? "cursor-not-allowed opacity-70" : ""}`}
            />
            <span className="shrink-0 text-[32px] align-top font-bold text-zinc-500">
              {fromCurrency}
            </span>
          </div>
          {isBuy && showRubLimitError && rubLimitError && (
            <div className="mx-2 mt-2 text-sm font-medium text-red-400">
              {rubLimitError}
            </div>
          )}
        </div>

        <div className="relative px-4">
          <div className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-zinc-700/50" />
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 shrink-0 flex-col items-center gap-0.5 rounded-[5px] border border-zinc-600/80 px-1 bg-[#121621] ">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-zinc-400">{label}</span>
              {ratesLoading ? (
                <span
                  className="inline-block h-3 w-[4.25rem] shrink-0 rounded bg-white/15 animate-pulse"
                  aria-hidden
                />
              ) : (
                <span className={`text-[12px] font-medium ${isBuy ? "text-emerald-400" : "text-red-400"}`}>
                  {displayRate}
                </span>
              )}
            </div>
          </div>
          {showSwapButton && (
            <button
              type="button"
              onClick={handleSwapClick}
              className="absolute left-6/7 top-1/2 flex h-10 w-10 shrink-0 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-600/80 bg-[#121621] text-white focus:outline-none [-webkit-tap-highlight-color:transparent]"
              aria-label={t("exchange.swapDirection")}
            >
              <ArrowDownUp className="w-6 h-6 text-white" />
            </button>
          )}
        </div>

        {/* Вы получите */}
        <div className="p-4 mt-8 pt-0">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-md font-bold text-white ${toCurrencyUi.badgeClass}`}
            >
              {toCurrency === "RUB" ? (
                <RubleIcon className="size-6 shrink-0" />
              ) : (
                toCurrencyUi.icon
              )}
            </div>
            <span className="text-base font-bold text-white">{t("exchange.youReceive")}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <input
              type="text"
              inputMode="decimal"
              ref={toInputRef}
              value={toAmountUi}
              onChange={handleToChange}
              onFocus={() => {
                setToFieldFocused(true);
                const initial = sanitizeExchangeInput(toAmount || "").replace(/\s/g, "");
                toFieldLatestRawRef.current = initial;
                setToInputRaw(toAmount || "");
              }}
              onBlur={(e) => {
                // DOM и state при контролируемом вводе могут отставать от последнего onChange при blur→кнопка.
                const fromDom = sanitizeExchangeInput(e.currentTarget.value).replace(/\s/g, "");
                const fromRef = toFieldLatestRawRef.current;
                const trimmed = fromRef.length >= fromDom.length ? fromRef : fromDom;
                if (toFieldFocused && trimmed !== "" && trimmed !== ".") {
                  const p = parseAmount(trimmed);
                  if (p !== null && p >= 0) {
                    if (toCurrency === "RUB") {
                      syncFromForTargetToAmount(formatRubAmount(p));
                    } else {
                      syncFromForTargetToAmount(formatUsdAmount(p));
                    }
                  }
                }
                setToFieldFocused(false);
                setToInputRaw("");
              }}
              disabled={ratesLoading}
              placeholder="0"
              className={`min-w-0 flex-1 bg-transparent text-[40px] font-bold outline-none placeholder:text-white/60 text-white ${
                ratesLoading ? "cursor-not-allowed opacity-70" : ""
              }`}
            />
            <span className="shrink-0 text-[32px] align-top font-bold text-zinc-500">
              {toCurrency}
            </span>
          </div>
          {!isBuy && showRubLimitError && rubLimitError && (
            <div className="mx-2 mt-1 text-sm font-medium text-red-400">
              {rubLimitError}
            </div>
          )}
        </div>
      </div>
      {insufficientFunds && (
        <p className="text-sm font-medium text-red-400">{t("exchange.insufficientFunds")}</p>
      )}
    </div>
  );
}
