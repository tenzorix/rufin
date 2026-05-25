/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchCard,
  fetchCardBalance,
  fetchCardRecharges,
  fetchCardTransactions,
  fetchCards,
  fetchCardsMe,
  isActiveCard,
  requestCard,
  setHasActiveCardsSnapshot,
  type Card,
  type CardsMe,
  type CardTransaction,
  type Recharge,
  type RechargeStatus,
  type RequestCardResponse,
} from "../api/cards";
import { getTelegramInitData } from "../api/telegram";
import { ApiRequestError } from "../api/users";
import { useI18n, type Language } from "../i18n";
import type { HistoryGroupViewModel, HistoryOperationViewModel } from "./useUserData";

const AUTH_HINT =
  "Telegram init data is missing. Open the app inside Telegram or set VITE_TELEGRAM_INIT_DATA for local testing.";

const CARDS_POLL_INTERVAL_MS = 4_000;
const CARD_ACTIVITY_POLL_INTERVAL_MS = 6_000;

type CardCatalogState = {
  loading: boolean;
  error: string | null;
  authMissing: boolean;
  me: CardsMe | null;
  cards: Card[];
};

type CardActivityState = {
  cardId: string | null;
  loading: boolean;
  error: string | null;
  history: HistoryGroupViewModel[];
  recharges: Recharge[];
  transactions: CardTransaction[];
  balanceUsd: number;
};

const initialCatalogState: CardCatalogState = {
  loading: true,
  error: null,
  authMissing: false,
  me: null,
  cards: [],
};

const initialActivityState: CardActivityState = {
  cardId: null,
  loading: true,
  error: null,
  history: [],
  recharges: [],
  transactions: [],
  balanceUsd: 0,
};

export function useCardsCatalog() {
  const [state, setState] = useState<CardCatalogState>(initialCatalogState);
  const [isRequestingCard, setIsRequestingCard] = useState(false);
  const isFetchingRef = useRef(false);
  const pollTimeoutRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimeoutRef.current !== null) {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const fetchAll = useCallback(async (force = false) => {
    if (!force && isFetchingRef.current) {
      return;
    }

    const authData = getTelegramInitData();
    if (!authData) {
      setState({
        ...initialCatalogState,
        loading: false,
        authMissing: true,
        error: AUTH_HINT,
      });
      stopPolling();
      return;
    }

    isFetchingRef.current = true;
    setState((previousState) => ({
      ...previousState,
      loading: true,
      authMissing: false,
      error: null,
    }));

    try {
      const [meResult, cardsResult] = await Promise.allSettled([
        fetchCardsMe(),
        fetchCards(),
      ]);

      const errors: string[] = [];

      const me =
        meResult.status === "fulfilled"
          ? meResult.value
          : (errors.push(formatRequestError("Cards config", meResult.reason)),
            null);

      let cards =
        cardsResult.status === "fulfilled"
          ? cardsResult.value
          : (errors.push(formatRequestError("Cards list", cardsResult.reason)),
            []);

      if (cards.some((card) => card.status === "requested")) {
        cards = await refreshRequestedCards(cards, errors);
      }

      if (cardsResult.status === "fulfilled") {
        setHasActiveCardsSnapshot(cards.some((card) => isActiveCard(card)));
      }

      setState({
        loading: false,
        authMissing: false,
        error: errors.length > 0 ? errors.join(". ") : null,
        me,
        cards,
      });
    } finally {
      isFetchingRef.current = false;
    }
  }, [stopPolling]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const refresh = useCallback(() => {
    void fetchAll(true);
  }, [fetchAll]);

  const requestNewCard = useCallback(async (): Promise<RequestCardResponse> => {
    setIsRequestingCard(true);

    try {
      const response = await requestCard();
      await fetchAll(true);
      return response;
    } finally {
      setIsRequestingCard(false);
    }
  }, [fetchAll]);

  const activeCards = useMemo(
    () => state.cards.filter((card) => isActiveCard(card)),
    [state.cards],
  );

  useEffect(() => {
    stopPolling();

    if (activeCards.some((card) => card.status === "requested")) {
      pollTimeoutRef.current = window.setTimeout(() => {
        void fetchAll(true);
      }, CARDS_POLL_INTERVAL_MS);
    }

    return stopPolling;
  }, [activeCards, fetchAll, stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  return useMemo(
    () => ({
      ...state,
      activeCards,
      hasActiveCards: activeCards.length > 0,
      isRequestingCard,
      refresh,
      requestNewCard,
    }),
    [activeCards, isRequestingCard, refresh, requestNewCard, state],
  );
}

export function useCardActivity(card: Card | null) {
  const { language } = useI18n();
  const [state, setState] = useState<CardActivityState>(initialActivityState);
  const isFetchingRef = useRef(false);
  const pollTimeoutRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollTimeoutRef.current !== null) {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  const fetchActivity = useCallback(async (force = false) => {
    if (!card || card.status !== "assigned") {
      requestIdRef.current += 1;
      isFetchingRef.current = false;
      stopPolling();
      setState({
        ...initialActivityState,
        cardId: card?.id ?? null,
        loading: false,
      });
      return;
    }

    if (!force && isFetchingRef.current) {
      return;
    }

    const authData = getTelegramInitData();
    if (!authData) {
      setState({
        ...initialActivityState,
        cardId: card.id,
        loading: false,
        error: AUTH_HINT,
      });
      stopPolling();
      return;
    }

    const requestId = ++requestIdRef.current;
    const cardId = card.id;
    isFetchingRef.current = true;
    setState((previousState) => ({
      ...(previousState.cardId === cardId ? previousState : initialActivityState),
      cardId,
      loading: true,
      error: null,
    }));

    try {
      const [transactionsResult, rechargesResult, balanceResult] =
        await Promise.allSettled([
          fetchCardTransactions(card.id),
          fetchCardRecharges(card.id),
          fetchCardBalance(card.id),
        ]);

      const errors: string[] = [];

      const transactions =
        transactionsResult.status === "fulfilled"
          ? transactionsResult.value
          : (errors.push(
              formatRequestError("Card transactions", transactionsResult.reason),
            ),
            []);

      const recharges =
        rechargesResult.status === "fulfilled"
          ? rechargesResult.value
          : (errors.push(
              formatRequestError("Card recharges", rechargesResult.reason),
            ),
            []);

      const balanceUsd =
        balanceResult.status === "fulfilled"
          ? parseNumericAmount(balanceResult.value.balance) ??
            calculateCardBalanceUsd(recharges, transactions)
          : calculateCardBalanceUsd(recharges, transactions);

      if (requestIdRef.current !== requestId) {
        return;
      }

      setState({
        cardId,
        loading: false,
        error: errors.length > 0 ? errors.join(". ") : null,
        history: buildCardHistory(recharges, transactions, language),
        recharges,
        transactions,
        balanceUsd,
      });
    } finally {
      if (requestIdRef.current === requestId) {
        isFetchingRef.current = false;
      }
    }
  }, [card, language, stopPolling]);

  useEffect(() => {
    requestIdRef.current += 1;

    if (!card || card.status !== "assigned") {
      isFetchingRef.current = false;
      stopPolling();
      setState({
        ...initialActivityState,
        cardId: card?.id ?? null,
        loading: false,
      });
      return;
    }

    setState({
      ...initialActivityState,
      cardId: card.id,
      loading: true,
    });

    void fetchActivity(true);
  }, [card?.id, card?.status, fetchActivity, stopPolling]);

  const refresh = useCallback(() => {
    void fetchActivity(true);
  }, [fetchActivity]);

  const hasPendingRecharge = useMemo(
    () =>
      state.recharges.some((recharge) =>
        isRechargePendingStatus(recharge.status),
      ),
    [state.recharges],
  );

  useEffect(() => {
    stopPolling();

    if (card?.status === "assigned" && hasPendingRecharge) {
      pollTimeoutRef.current = window.setTimeout(() => {
        void fetchActivity(true);
      }, CARD_ACTIVITY_POLL_INTERVAL_MS);
    }

    return stopPolling;
  }, [card?.status, fetchActivity, hasPendingRecharge, stopPolling]);

  useEffect(() => stopPolling, [stopPolling]);

  return useMemo(
    () => ({
      ...state,
      hasPendingRecharge,
      refresh,
    }),
    [hasPendingRecharge, refresh, state],
  );
}

async function refreshRequestedCards(
  cards: Card[],
  errors: string[],
): Promise<Card[]> {
  const refreshedCards = await Promise.allSettled(
    cards.map((card) =>
      card.status === "requested" ? fetchCard(card.id) : Promise.resolve(card),
    ),
  );

  return refreshedCards.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    errors.push(
      formatRequestError("Card status", result.reason),
    );
    return cards[index];
  });
}

function buildCardHistory(
  recharges: Recharge[],
  transactions: CardTransaction[],
  language: Language,
): HistoryGroupViewModel[] {
  const operations = [
    ...recharges.map((recharge) => mapRechargeToHistory(recharge, language)),
    ...transactions.map((transaction) =>
      mapTransactionToHistory(transaction, language),
    ),
  ].sort((left, right) => (right.timestampMs ?? 0) - (left.timestampMs ?? 0));

  if (operations.length === 0) {
    return [];
  }

  const groups = new Map<string, HistoryGroupViewModel>();

  operations.forEach((operation) => {
    const dayKey =
      typeof operation.timestampMs === "number" && Number.isFinite(operation.timestampMs)
        ? formatDayKey(new Date(operation.timestampMs))
        : operation.id;

    const existingGroup = groups.get(dayKey);

    if (existingGroup) {
      existingGroup.operations.push(operation);
      return;
    }

    const label =
      typeof operation.timestampMs === "number" && Number.isFinite(operation.timestampMs)
        ? formatDayLabel(new Date(operation.timestampMs), language)
        : language === "en"
        ? "No date"
        : "Без даты";

    groups.set(dayKey, {
      id: dayKey,
      label,
      operations: [operation],
    });
  });

  return Array.from(groups.values());
}

function mapRechargeToHistory(
  recharge: Recharge,
  language: Language,
): HistoryOperationViewModel {
  const timestamp = parseDate(recharge.createdAt);
  const timestampMs = timestamp?.getTime() ?? null;
  const depositStatusKind = mapRechargeStatusToDepositKind(recharge.status);
  const amountLabel = formatCardHistoryAmount(recharge.targetAmountUsd, true);
  const isInitialRecharge = recharge.purpose === "initial";

  return {
    id: recharge.id,
    title:
      isInitialRecharge
        ? language === "en"
          ? "Initial top up"
          : "Первое пополнение"
        : language === "en"
        ? "Top up"
        : "Пополнение",
    time: timestamp ? formatTime(timestamp, language) : "—:—",
    amount: amountLabel,
    amountUsd: amountLabel,
    amountUsdValue: recharge.targetAmountUsd,
    isPositive: true,
    isDeposit: true,
    depositStatusKind,
    depositStatusLabel: mapRechargeStatusLabel(recharge.status, language),
    timestampMs,
    transactionId: recharge.id,
    depositFromAddress: "Lumo",
  };
}

function mapTransactionToHistory(
  transaction: CardTransaction,
  language: Language,
): HistoryOperationViewModel {
  const timestamp = parseDate(transaction.transactionTime);
  const timestampMs = timestamp?.getTime() ?? null;
  const signedAmount = resolveCardTransactionSignedAmount(transaction);
  const isPositive =
    typeof signedAmount === "number"
      ? signedAmount > 0
      : resolveCardTransactionIsPositive(transaction, null);
  const absoluteAmount =
    typeof signedAmount === "number" ? Math.abs(signedAmount) : 0;

  return {
    id: transaction.id,
    title:
      transaction.merchantName?.trim() ||
      transaction.typeName?.trim() ||
      (language === "en" ? "Card transaction" : "Операция по карте"),
    time: timestamp ? formatTime(timestamp, language) : "—:—",
    amount: formatCardHistoryAmount(absoluteAmount, isPositive),
    amountUsd: formatCardHistoryAmount(absoluteAmount, isPositive),
    amountUsdValue: signedAmount,
    isPositive,
    timestampMs,
    transactionId: transaction.id,
    merchantName: transaction.merchantName ?? undefined,
    exchangeFromCurrency: transaction.currency ?? "USD",
    exchangeToCurrency: transaction.currency ?? "USD",
    orderStatus: transaction.statusName ?? undefined,
  };
}

function calculateCardBalanceUsd(
  recharges: Recharge[],
  transactions: CardTransaction[],
): number {
  const rechargesTotal = recharges.reduce((total, recharge) => {
    if (recharge.status !== "succeeded") {
      return total;
    }

    return total + recharge.targetAmountUsd;
  }, 0);

  const transactionsTotal = transactions.reduce((total, transaction) => {
    const signedAmount = resolveCardTransactionSignedAmount(transaction);
    return total + (signedAmount ?? 0);
  }, 0);

  return roundToTwo(rechargesTotal + transactionsTotal);
}

function resolveCardTransactionSignedAmount(
  transaction: CardTransaction,
): number | null {
  const numericAmount = parseNumericAmount(transaction.amount);
  if (typeof numericAmount !== "number") {
    return null;
  }

  const absoluteAmount = Math.abs(numericAmount);
  if (absoluteAmount === 0) {
    return 0;
  }

  const isPositive = resolveCardTransactionIsPositive(transaction, numericAmount);
  return isPositive ? absoluteAmount : -absoluteAmount;
}

function resolveCardTransactionIsPositive(
  transaction: CardTransaction,
  numericAmount: number | null,
): boolean {
  const normalizedType = normalizeCardTransactionText(transaction.typeName);
  const normalizedStatus = normalizeCardTransactionText(transaction.statusName);
  const isFailedConsumption =
    normalizedType === "consumption" &&
    (normalizedStatus === "failed" ||
      normalizedStatus === "declined" ||
      normalizedStatus === "rejected");

  if (isFailedConsumption) {
    return false;
  }

  if (transaction.direction === 1) {
    return true;
  }

  if (transaction.direction === 2) {
    return false;
  }

  const normalizedDirection = normalizeCardTransactionText(
    transaction.directionName,
  );
  if (normalizedDirection === "credit") {
    return true;
  }

  if (normalizedDirection === "debit") {
    return false;
  }

  if (typeof numericAmount === "number") {
    return numericAmount > 0;
  }

  return false;
}

function normalizeCardTransactionText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function parseNumericAmount(value: string | null | undefined): number | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const normalized = value.replace(",", ".").trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCardHistoryAmount(value: number, isPositive: boolean): string {
  const absolute = Math.abs(value);
  const formatted = absolute.toFixed(2).replace(/\.?0+$/, "");
  return `${isPositive ? "+" : "-"}${formatted}$`;
}

export function formatCardBalance(value: number): {
  integer: string;
  fractional: string;
} {
  const safeValue = Number.isFinite(value) ? value : 0;
  const [integer, fractional] = safeValue.toFixed(2).split(".");
  return {
    integer,
    fractional,
  };
}

export function formatCardMaskedSuffix(cardNumberMasked: string | null): string {
  if (!cardNumberMasked) {
    return "••••";
  }

  const digits = cardNumberMasked.replace(/\D/g, "");
  const suffix = digits.slice(-4);
  return suffix ? `*${suffix}` : cardNumberMasked;
}

function formatTime(date: Date, language: Language): string {
  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(date: Date, language: Language): string {
  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "ru-RU", {
    day: "numeric",
    month: "long",
  }).format(date);
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

function mapRechargeStatusToDepositKind(
  status: RechargeStatus,
): "success" | "error" | "processing" {
  if (status === "succeeded") {
    return "success";
  }

  if (status === "failed" || status === "refunded") {
    return "error";
  }

  return "processing";
}

function mapRechargeStatusLabel(status: RechargeStatus, language: Language): string {
  if (status === "succeeded") {
    return language === "en" ? "Completed" : "Завершено";
  }

  if (status === "failed" || status === "refunded") {
    return language === "en" ? "Refunded" : "Возвращено";
  }

  return language === "en" ? "Processing" : "В обработке";
}

function isRechargePendingStatus(status: RechargeStatus): boolean {
  return (
    status === "pending" ||
    status === "pending_debit" ||
    status === "pending_upay" ||
    status === "in_progress_manual"
  );
}

function formatRequestError(source: string, error: unknown): string {
  if (error instanceof ApiRequestError) {
    return `${source}: ${error.message}`;
  }

  if (error instanceof Error && error.message.trim()) {
    return `${source}: ${error.message.trim()}`;
  }

  return `${source}: Request failed`;
}
