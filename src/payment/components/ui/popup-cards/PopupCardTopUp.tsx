import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { toast } from "@/store/useToastStore";
import {
  useLumoBalanceQuery,
  useLumoRatesCurrentQuery,
  useLumoWalletQuery,
} from "@/api/lumoHooks";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type PanInfo } from "../../../utils/motionShim";
import RubIcon from "../../../assets/svg/rub";
import UsdtIcon from "../../../assets/svg/usdt";
import {
  fetchCardRechargeQuote,
  rechargeCard,
  type RechargeQuote,
} from "../../../api/cards";
import { ApiRequestError } from "../../../api/users";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";
import { useTelegramPopupBackButton } from "../../../hooks/useTelegramPopupBackButton";
import { useI18n } from "../../../i18n";
import type { CurrencyId } from "../../header/Header";

interface PopupCardTopUpProps {
  isOpen: boolean;
  onClose: () => void;
  cardId: string;
  minRechargeUsd: number;
  maxRechargeUsd: number;
  rechargeMarkupBps: number;
  onSuccess: () => void;
}

const DEFAULT_MAX_TARGET_AMOUNT = 10_000;
const INPUT_INTEGER_LIMIT = 7;
const QUOTE_DEBOUNCE_MS = 350;

function parseFiniteAmount(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");
    if (!normalized) {
      return null;
    }

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeRechargeQuote(
  value: RechargeQuote,
): RechargeQuote | null {
  const targetAmountUsd = parseFiniteAmount(value.targetAmountUsd);
  const commissionUsdt = parseFiniteAmount(value.commissionUsdt);
  const markupBps = parseFiniteAmount(value.markupBps);
  const markupUsdt = parseFiniteAmount(value.markupUsdt);
  const totalDebitUsdt = parseFiniteAmount(value.totalDebitUsdt);
  const availableBalance = parseFiniteAmount(value.availableBalance);

  if (
    targetAmountUsd === null ||
    commissionUsdt === null ||
    markupBps === null ||
    markupUsdt === null ||
    totalDebitUsdt === null ||
    availableBalance === null
  ) {
    return null;
  }

  return {
    ...value,
    targetAmountUsd,
    commissionUsdt,
    markupBps,
    markupUsdt,
    totalDebitUsdt,
    availableBalance,
    sufficient: Boolean(value.sufficient),
  };
}

function formatAmountInput(raw: string, maxTargetAmount: number) {
  const withDot = raw.replace(",", ".").replace(/[^\d.]/g, "");
  const dotIndex = withDot.indexOf(".");
  const normalized =
    dotIndex === -1
      ? withDot
      : `${withDot.slice(0, dotIndex + 1)}${withDot
          .slice(dotIndex + 1)
          .replace(/\./g, "")}`;
  const match = normalized.match(/^\d*\.?\d{0,2}/);
  const value = match ? match[0] : "";

  if (!value) {
    return "";
  }

  const [integerPart = "", fractionalPart] = value.split(".");
  const limitedIntegerPart = integerPart.slice(0, INPUT_INTEGER_LIMIT);
  const limitedValue =
    typeof fractionalPart === "string"
      ? `${limitedIntegerPart}.${fractionalPart}`
      : limitedIntegerPart;
  const numericValue = Number.parseFloat(limitedValue);

  if (!Number.isNaN(numericValue) && numericValue > maxTargetAmount) {
    return String(maxTargetAmount);
  }

  return limitedValue;
}

function formatPlainAmount(value: unknown) {
  const numericValue = parseFiniteAmount(value);
  if (numericValue === null) {
    return "0";
  }

  return numericValue.toFixed(2).replace(/\.?0+$/, "");
}

function formatBalanceAmount(
  value: number,
  currency: CurrencyId,
): {
  symbol: string;
  integer: string;
  fractional: string;
} {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const fractionDigits = currency === "rub" ? 0 : 2;
  const formatted = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
    .format(safeValue)
    .replace(",", ".");
  const [integer = "0", fractional] = formatted.split(".");

  return {
    symbol: currency === "rub" ? "₽" : "$",
    integer,
    fractional: fractional ? `.${fractional}` : "",
  };
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    if (
      typeof window === "undefined" ||
      typeof window.requestAnimationFrame !== "function"
    ) {
      resolve();
      return;
    }

    window.requestAnimationFrame(() => resolve());
  });
}

export default function PopupCardTopUp({
  isOpen,
  onClose,
  cardId,
  minRechargeUsd,
  maxRechargeUsd,
  rechargeMarkupBps,
  onSuccess,
}: PopupCardTopUpProps) {
  const { t } = useI18n();
  const { data: lumoBalance, refetch: refetchLumoBalance } =
    useLumoBalanceQuery({ refetchInterval: 10_000 });
  const { data: lumoWallet, refetch: refetchLumoWallet } =
    useLumoWalletQuery();
  const { data: lumoRate } = useLumoRatesCurrentQuery();
  const [amountValue, setAmountValue] = useState("");
  const [activeCurrency, setActiveCurrency] = useState<CurrencyId>("usdt");
  const [quote, setQuote] = useState<RechargeQuote | null>(null);
  const [isQuotePending, setIsQuotePending] = useState(false);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAmountInputFocused, setIsAmountInputFocused] = useState(false);
  const quoteRequestIdRef = useRef(0);
  const deferredAmountValue = useDeferredValue(amountValue);

  useTelegramPopupBackButton(isOpen, onClose);
  useBodyScrollLock(isOpen);

  const truncateAddress = useCallback((str: string) => {
    const s = str.trim();
    if (s.length <= 12) return s;
    return `${s.slice(0, 7)}...${s.slice(-3)}`;
  }, []);

  const availableUsdt = lumoBalance?.available ?? 0;
  const rateRubPerUsdt = lumoRate?.rate ?? null;

  const displayAddress = useMemo(() => {
    const addr = lumoWallet?.address;
    if (!addr) return "";
    return `${t("popup.withdraw.summaryLumo")} • ${truncateAddress(addr)}`;
  }, [lumoWallet?.address, t, truncateAddress]);

  const formattedAmount = useMemo(() => {
    const amount =
      activeCurrency === "rub" && rateRubPerUsdt !== null
        ? availableUsdt * rateRubPerUsdt
        : availableUsdt;
    return formatBalanceAmount(amount, activeCurrency);
  }, [activeCurrency, availableUsdt, rateRubPerUsdt]);

  const amountNumber = useMemo(
    () => Number.parseFloat(deferredAmountValue.replace(",", ".")),
    [deferredAmountValue],
  );
  const maxTargetAmount = Number.isFinite(maxRechargeUsd)
    ? Math.min(maxRechargeUsd, DEFAULT_MAX_TARGET_AMOUNT)
    : DEFAULT_MAX_TARGET_AMOUNT;
  const hasInput = deferredAmountValue.trim() !== "";
  const isWithinRange =
    !Number.isNaN(amountNumber) &&
    amountNumber >= minRechargeUsd &&
    amountNumber <= maxTargetAmount;
  const currencyIndex = activeCurrency === "usdt" ? 0 : 1;
  const currencyIndicatorTransform = `translateX(calc(${currencyIndex} * (var(--header-currency-btn-size) + var(--header-currency-gap))))`;
  const submitLabel = quote
    ? t("cards.topUp.submitValue").replace(
        "{amount}",
        formatPlainAmount(quote.totalDebitUsdt),
      )
    : t("cards.topUp.submit");
  const isSubmitBusy = isSubmitting || isQuotePending;
  const markupPercent = Math.max(0, rechargeMarkupBps) / 100;
  const commissionMultiplier = 1 + Math.max(0, rechargeMarkupBps) / 10_000;
  const canSubmitQuote = Boolean(quote?.sufficient);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 120 || info.velocity.y > 700) {
        onClose();
      }
    },
    [onClose],
  );

  const handleSheetKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  const handleAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAmountValue(formatAmountInput(event.target.value, maxTargetAmount));
    },
    [maxTargetAmount],
  );

  const handleMaxClick = useCallback(() => {
    const maxAffordableTargetAmount =
      commissionMultiplier > 0
        ? availableUsdt / commissionMultiplier
        : availableUsdt;
    const numericAmount = Math.min(
      Math.floor(Math.max(0, maxAffordableTargetAmount) * 100) / 100,
      maxTargetAmount,
    );
    const value =
      numericAmount > 0
        ? Number.isInteger(numericAmount)
          ? String(numericAmount)
          : numericAmount.toFixed(2)
        : "0";

    setAmountValue(value);
  }, [availableUsdt, commissionMultiplier, maxTargetAmount]);

  const handleCurrencyToggleClick = useCallback((currency: CurrencyId) => {
    setActiveCurrency(currency);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!quote || !quote.sufficient || isQuotePending || isQuoteLoading || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    await waitForNextPaint();

    try {
      const result = await rechargeCard(cardId, {
        targetAmount: quote.targetAmountUsd,
      });
      const { recharge } = result;

      toast.success(
        recharge.status === "succeeded"
          ? t("cards.topUp.success").replace(
              "{amount}",
              formatPlainAmount(recharge.targetAmountUsd),
            )
          : t("cards.topUp.processing"),
      );

      void refetchLumoBalance();
      onSuccess();
      onClose();
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : error instanceof Error
          ? error.message
          : t("cards.error.unavailable");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    cardId,
    isQuoteLoading,
    isQuotePending,
    isSubmitting,
    onClose,
    onSuccess,
    quote,
    refetchLumoBalance,
    t,
  ]);

  useEffect(() => {
    if (!isOpen) {
      quoteRequestIdRef.current += 1;
      setAmountValue("");
      setActiveCurrency("usdt");
      setQuote(null);
      setIsQuotePending(false);
      setIsQuoteLoading(false);
      setIsSubmitting(false);
      setIsAmountInputFocused(false);
      return;
    }

    if (!lumoBalance) {
      void refetchLumoBalance();
    }

    if (!lumoWallet) {
      void refetchLumoWallet();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isOpen,
    lumoBalance,
    lumoWallet,
    onClose,
    refetchLumoBalance,
    refetchLumoWallet,
  ]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    quoteRequestIdRef.current += 1;

    if (!hasInput || !isWithinRange) {
      startTransition(() => {
        setQuote(null);
        setIsQuotePending(false);
        setIsQuoteLoading(false);
      });
      return;
    }

    const currentRequestId = quoteRequestIdRef.current;
    startTransition(() => {
      setQuote(null);
      setIsQuotePending(true);
      setIsQuoteLoading(false);
    });

    const timeoutId = window.setTimeout(() => {
      if (quoteRequestIdRef.current !== currentRequestId) {
        return;
      }

      startTransition(() => {
        setIsQuoteLoading(true);
      });

      void fetchCardRechargeQuote(cardId, {
        targetAmount: amountNumber,
      })
        .then((response) => {
          if (quoteRequestIdRef.current !== currentRequestId) {
            return;
          }

          const normalizedQuote = normalizeRechargeQuote(response);

          startTransition(() => {
            setQuote(normalizedQuote);
          });
        })
        .catch(() => {
          if (quoteRequestIdRef.current !== currentRequestId) {
            return;
          }

          startTransition(() => {
            setQuote(null);
          });
        })
        .finally(() => {
          if (quoteRequestIdRef.current === currentRequestId) {
            startTransition(() => {
              setIsQuotePending(false);
              setIsQuoteLoading(false);
            });
          }
        });
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [amountNumber, cardId, hasInput, isOpen, isWithinRange]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="popupPurchaseOverlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />
          <motion.div className="popupWithdrawContainer">
            <motion.div
              className="popupWithdrawSheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 280,
                mass: 0.9,
              }}
              drag={isAmountInputFocused ? false : "y"}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.24 }}
              onDragEnd={handleDragEnd}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={handleSheetKeyDown}
              role="dialog"
              aria-modal="true"
              aria-label={t("cards.topUp.title")}
            >
              <div className="popupWithdrawHandleArea">
                <span className="popupWithdrawHandle" aria-hidden />
              </div>

              <div className="popupWithdrawContent popupCardTopUpContent">
                <div className="popupWithdrawSummaryCard popupCardTopUpSummaryCard">
                  <div className="popupWithdrawSummaryLeft">
                    <span className="popupWithdrawSummaryAddress">
                      {displayAddress || "—"}
                    </span>

                    <div className="popupWithdrawSummaryAmount accountAmount">
                      <span className="accountAmountCurrency">
                        {formattedAmount.symbol}
                      </span>
                      <span>{formattedAmount.integer}</span>
                      {formattedAmount.fractional ? (
                        <span className="accountAmountGray">
                          {formattedAmount.fractional}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="popupWithdrawToggleGuideAnchor">
                    <div className="popupWithdrawSummaryCurrency headerCurrency">
                      <span
                        aria-hidden
                        className="headerCurrencyIndicator"
                        style={{ transform: currencyIndicatorTransform }}
                      />
                      <button
                        type="button"
                        className="headerCurrencyBtn"
                        aria-pressed={activeCurrency === "usdt"}
                        aria-label="USDT"
                        onClick={() => handleCurrencyToggleClick("usdt")}
                      >
                        <UsdtIcon isActive={activeCurrency === "usdt"} />
                      </button>
                      <button
                        type="button"
                        className="headerCurrencyBtn"
                        aria-pressed={activeCurrency === "rub"}
                        aria-label="RUB"
                        onClick={() => handleCurrencyToggleClick("rub")}
                      >
                        <RubIcon isActive={activeCurrency === "rub"} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="popupWithdrawBody popupCardTopUpBody">
                  <div className="popupWithdrawField">
                    <div className="popupWithdrawInputWrap">
                      <input
                        type="text"
                        inputMode="decimal"
                        className="popupWithdrawInputField"
                        placeholder={t("cards.topUp.placeholder")}
                        value={amountValue}
                        onChange={handleAmountChange}
                        onFocus={() => setIsAmountInputFocused(true)}
                        onBlur={() => setIsAmountInputFocused(false)}
                        autoComplete="off"
                        enterKeyHint="done"
                        aria-label={t("cards.topUp.placeholder")}
                      />
                      <button
                        type="button"
                        className="popupWithdrawInputMaxBtn"
                        onClick={handleMaxClick}
                      >
                        {t("popup.withdraw.max")}
                      </button>
                    </div>
                  </div>

                  <div className="popupWithdrawFee popupCardTopUpFee">
                    <span className="popupWithdrawFeeLabel">
                      {t("cards.topUp.fee").replace(
                        "{percent}",
                        formatPlainAmount(markupPercent),
                      )}
                    </span>
                  </div>
                </div>

                <div className="popupWithdrawFooter popupCardTopUpFooter">
                  <button
                    type="button"
                    className={`popupPurchaseDisputeBtn popupPurchaseDisputeBtn--static popupCardTopUpSubmitBtn popupVpnBuyButton${
                      canSubmitQuote && !isSubmitBusy
                        ? " popupWithdrawSubmitBtn--valid"
                        : ""
                    }`}
                    onClick={() => void handleSubmit()}
                    disabled={!canSubmitQuote || isSubmitBusy}
                    aria-busy={isSubmitBusy}
                  >
                    <span
                      className={`retryButtonLabel${
                        isSubmitBusy ? " is-hidden" : ""
                      }`}
                    >
                      {submitLabel}
                    </span>
                    <span
                      className={`retryButtonSpinner${
                        isSubmitBusy ? " is-visible" : ""
                      }`}
                      aria-hidden={!isSubmitBusy}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
