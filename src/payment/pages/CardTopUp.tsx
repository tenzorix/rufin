import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";
import PageHeader from "@/components/shared/PageHeader";
import CashAmountCard from "@/components/common/CashAmountCard";
import { useBackButton } from "@/hooks/useBackButton";
import { useLumoBalanceQuery, useLumoRatesCurrentQuery } from "@/api/lumoHooks";
import UsdtOperationIcon from "@/assets/icons/UsdtOperationIcon";
import {
  formatRubAmount,
  parseAmount,
  roundUsdTwoDecimals,
} from "@/utils/exchangeCalculations";
import { sanitizeExchangeInput } from "@/utils/exchangeInput";
import { toast } from "@/store/useToastStore";
import {
  fetchCardRechargeQuote,
  rechargeCard,
  type RechargeQuote,
} from "../api/cards";
import { ApiRequestError } from "../api/users";
import { useCardsCatalog } from "../hooks/useCards";

const QUOTE_DEBOUNCE_MS = 350;

function parseFiniteAmount(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");
    if (!normalized) return null;

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeRechargeQuote(value: RechargeQuote): RechargeQuote | null {
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

function formatPlainAmount(value: unknown) {
  const numericValue = parseFiniteAmount(value);
  if (numericValue === null) return "0";

  return numericValue.toFixed(2).replace(/\.?0+$/, "");
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

function formatUsdt(value: number) {
  const safeValue = Number.isFinite(value) ? value : 0;

  return safeValue
    .toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    .replace(/,/g, " ");
}

type RufinSourceCardProps = {
  available: number;
};

function RufinSourceCard({ available }: RufinSourceCardProps) {
  const { t } = useTranslation();
  const [availableWhole, availableFraction] = formatUsdt(available).split(".");

  return (
    <div className="flex h-10 w-full items-center gap-2">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-white/[0.08] p-2 text-white">
        <UsdtOperationIcon />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[18px] font-bold leading-none text-white">
          <span>$ {availableWhole}</span>
          {availableFraction && (
            <span className="text-white opacity-40">.{availableFraction}</span>
          )}
        </div>
        <div className="mt-1 flex min-w-0 items-center text-[13px] font-bold leading-none text-white/65">
          <span className="shrink-0">{t("withdraw.rufinSource")}</span>
        </div>
      </div>
    </div>
  );
}

export default function CardTopUpPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<RechargeQuote | null>(null);
  const [isQuotePending, setIsQuotePending] = useState(false);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const quoteRequestIdRef = useRef(0);
  useBackButton();

  const {
    activeCards,
    me,
    loading: cardsLoading,
    refresh: refreshCards,
  } = useCardsCatalog();
  const balanceQuery = useLumoBalanceQuery({ refetchInterval: 10_000 });
  const rateQuery = useLumoRatesCurrentQuery();
  const available = balanceQuery.data?.available ?? 0;
  const rateRubPerUsdt = rateQuery.data?.rate ?? null;
  const stateCardId =
    typeof location.state?.cardId === "string" ? location.state.cardId : null;

  const selectedCard = useMemo(
    () =>
      activeCards.find((card) => card.id === stateCardId) ??
      activeCards[0] ??
      null,
    [activeCards, stateCardId],
  );
  const parsedRubAmount = useMemo(() => parseAmount(amount), [amount]);
  const targetAmountUsd = useMemo(() => {
    if (
      parsedRubAmount === null ||
      parsedRubAmount <= 0 ||
      rateRubPerUsdt === null ||
      rateRubPerUsdt <= 0
    ) {
      return null;
    }

    return roundUsdTwoDecimals(parsedRubAmount / rateRubPerUsdt);
  }, [parsedRubAmount, rateRubPerUsdt]);
  const minRechargeUsd = me?.rechargeMinUsd ?? 0.01;
  const maxRechargeUsd = me?.rechargeMaxUsd ?? 10_000;
  const isWithinRange =
    targetAmountUsd !== null &&
    targetAmountUsd >= minRechargeUsd &&
    targetAmountUsd <= maxRechargeUsd;
  const isSubmitBusy = isSubmitting || isQuotePending || isQuoteLoading;
  const canSubmit = Boolean(
    selectedCard?.status === "assigned" &&
      quote?.sufficient &&
      !cardsLoading &&
      !isSubmitBusy,
  );

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nextRaw = sanitizeExchangeInput(e.target.value).split(".")[0] ?? "";
    setAmount(nextRaw);
  };

  const handleAmountBlur = () => {
    const parsed = parseAmount(amount);
    if (parsed === null || amount === "") return;
    setAmount(formatRubAmount(parsed));
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedCard || !quote || !quote.sufficient || isSubmitBusy) {
      return;
    }

    setIsSubmitting(true);
    await waitForNextPaint();

    try {
      const result = await rechargeCard(selectedCard.id, {
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

      await balanceQuery.refetch();
      refreshCards();
      navigate("/card", { replace: true });
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
    balanceQuery,
    isSubmitBusy,
    navigate,
    quote,
    refreshCards,
    selectedCard,
    t,
  ]);

  useEffect(() => {
    quoteRequestIdRef.current += 1;

    if (!selectedCard || selectedCard.status !== "assigned" || !isWithinRange || targetAmountUsd === null) {
      setQuote(null);
      setIsQuotePending(false);
      setIsQuoteLoading(false);
      return;
    }

    const currentRequestId = quoteRequestIdRef.current;
    setQuote(null);
    setIsQuotePending(true);
    setIsQuoteLoading(false);

    const timeoutId = window.setTimeout(() => {
      if (quoteRequestIdRef.current !== currentRequestId) {
        return;
      }

      setIsQuoteLoading(true);

      void fetchCardRechargeQuote(selectedCard.id, {
        targetAmount: targetAmountUsd,
      })
        .then((response) => {
          if (quoteRequestIdRef.current !== currentRequestId) {
            return;
          }

          setQuote(normalizeRechargeQuote(response));
        })
        .catch(() => {
          if (quoteRequestIdRef.current !== currentRequestId) {
            return;
          }

          setQuote(null);
        })
        .finally(() => {
          if (quoteRequestIdRef.current === currentRequestId) {
            setIsQuotePending(false);
            setIsQuoteLoading(false);
          }
        });
    }, QUOTE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isWithinRange, selectedCard, targetAmountUsd]);

  return (
    <div className="mx-auto w-full max-w-md pt-4">
      <PageHeader title={t("cards.topUpPage.title")} compact />

      <div className="mt-6">
        <CashAmountCard
          label={t("cashOrder.youPay")}
          amount={amount}
          onChange={handleAmountChange}
          onBlur={handleAmountBlur}
        />
      </div>

      <div className="fixed bottom-6 left-1/2 z-20 flex w-[calc(100%-32px)] max-w-md -translate-x-1/2 flex-col gap-3">
        <RufinSourceCard available={available} />
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void handleSubmit()}
          aria-busy={isSubmitBusy}
          className={`h-10 w-full rounded-[14px] text-center text-[14px] font-bold transition-colors disabled:cursor-not-allowed [-webkit-tap-highlight-color:transparent] ${
            canSubmit
              ? "bg-white text-[#080C18]"
              : "bg-white/30 text-white/70"
          }`}
        >
          {t("account.deposit")}
        </button>
      </div>
    </div>
  );
}
