import axios, { type AxiosRequestConfig } from "axios";
import { lumoApi } from "@/api/client";
import { getTelegramInitData } from "./telegram";
import { ApiRequestError } from "./users";

const CARDS_API_PREFIX = "/lumo/cards";
const ACTIVE_CARDS_STORAGE_KEY = "has_active_cards";
const DEFAULT_CARDS_LIMIT = 50;
const DEFAULT_MAX_CARDS_PER_USER = Number.MAX_SAFE_INTEGER;

let cachedHasActiveCards: boolean | null = null;
let hasLoadedActiveCardsSnapshot = false;
let inflightActiveCardsRequest: Promise<boolean> | null = null;

export type CardStatus = "requested" | "assigned" | "retired" | "failed";
export type RechargeStatus =
  | "pending"
  | "pending_debit"
  | "pending_upay"
  | "succeeded"
  | "in_progress_manual"
  | "failed"
  | "refunded";
export type RechargePurpose = "initial" | "user";

export interface CardsConfig {
  openingFeeUsdt: number;
  openingFeeBreakdown: {
    lumoFeeUsdt: number;
    markupUsdt: number;
  };
  minInitialDepositUsdt: number;
  reserveTotalUsdt: number;
  rechargeMarkupBps: number;
  rechargeMinUsd: number;
  rechargeMaxUsd: number;
  minInitialDepositUsd: number;
  minRechargeUsd: number;
  commissionBps: number;
  commissionPercent: number;
  maxCardsPerUser: number;
  testMode: boolean;
}

export type CardsMe = CardsConfig;

export interface Card {
  id: string;
  status: CardStatus;
  maskedPan: string | null;
  expiry: string | null;
  failureReason: string | null;
  assignedAt: string | null;
  createdAt: string;
  initialDepositCompleted: boolean;
}

export type RequestCardResponse =
  | {
      status: "assigned";
      card: Card;
      debitedUsdt?: number;
      newBalance?: number;
    }
  | {
      status: "pending";
      card: Card;
      reservedUsdt?: number;
      message?: string;
    };

export interface RechargeQuote {
  cardId: string;
  targetAmountUsd: number;
  commissionUsdt: number;
  markupBps: number;
  markupUsdt: number;
  totalDebitUsdt: number;
  availableBalance: number;
  sufficient: boolean;
}

export interface Recharge {
  id: string;
  cardId: string;
  status: RechargeStatus;
  purpose?: RechargePurpose;
  targetAmountUsd: number;
  totalDebitUsdt: number;
  commissionUsdt: number;
  markupUsdt: number;
  userChargeUsdt: number;
  ourFeeUsdt: number;
  failureReason: string | null;
  createdAt: string;
}

export interface RechargeResponse {
  recharge: Recharge;
  newBalance: number;
}

export interface CardTransaction {
  id: string;
  cardId?: string;
  amount: string;
  currency: string | null;
  merchantName: string | null;
  typeName: string | null;
  statusName: string | null;
  direction: number | null;
  directionName: string | null;
  transactionTime: string;
  fee: string | null;
}

export interface CardSensitive {
  cardId: string;
  cardNumberFull: string;
  cardCvv: string;
  expiry: string;
}

export interface CardOtp {
  id: string;
  cardId: string;
  code: string;
  maskedCard: string | null;
  subject: string | null;
  receivedAt: string | null;
  expiresAt: string | null;
  consumedAt: string | null;
}

export interface CardBalance {
  balance: string;
  currency: string;
  fetchedAt: string;
}

interface CardsListResponse {
  cards: unknown[];
  total: number;
}

interface RechargesListResponse {
  recharges: unknown[];
  total: number;
}

interface CardTransactionsParams {
  limit?: number;
  before?: string;
}

interface PaginatedParams {
  limit?: number;
  offset?: number;
}

interface RechargeAmountDto {
  targetAmount: number;
}

export async function fetchCardsConfig(): Promise<CardsConfig> {
  const data = await requestJson<unknown>({
    method: "GET",
    url: `${CARDS_API_PREFIX}/config`,
  });
  return normalizeCardsConfig(data);
}

export function fetchCardsMe(): Promise<CardsMe> {
  return fetchCardsConfig();
}

export async function fetchCards(): Promise<Card[]> {
  const data = await requestJson<CardsListResponse | unknown[]>({
    method: "GET",
    url: CARDS_API_PREFIX,
    params: {
      limit: DEFAULT_CARDS_LIMIT,
      offset: 0,
    },
  });

  const cards = Array.isArray(data) ? data : data.cards;
  return cards.map(normalizeCard);
}

export function getHasActiveCardsSnapshot(): boolean | null {
  ensureActiveCardsSnapshot();
  return cachedHasActiveCards;
}

export async function preloadHasActiveCards(): Promise<boolean | null> {
  ensureActiveCardsSnapshot();

  const authData = getTelegramInitData();
  if (!authData) {
    return cachedHasActiveCards;
  }

  if (inflightActiveCardsRequest) {
    return inflightActiveCardsRequest;
  }

  inflightActiveCardsRequest = requestHasActiveCards().finally(() => {
    inflightActiveCardsRequest = null;
  });

  return inflightActiveCardsRequest;
}

export function setHasActiveCardsSnapshot(value: boolean): void {
  ensureActiveCardsSnapshot();
  cachedHasActiveCards = value;
  persistActiveCardsSnapshot(value);
}

export async function requestCard(): Promise<RequestCardResponse> {
  const data = await requestJson<Record<string, unknown>>({
    method: "POST",
    url: `${CARDS_API_PREFIX}/request`,
  });
  const status = data.status === "assigned" ? "assigned" : "pending";
  const card = normalizeCard(data.card);

  if (status === "assigned") {
    return {
      status,
      card,
      debitedUsdt: toNumber(data.debitedUsdt) ?? undefined,
      newBalance: toNumber(data.newBalance) ?? undefined,
    };
  }

  return {
    status,
    card,
    reservedUsdt: toNumber(data.reservedUsdt) ?? undefined,
    message: toStringOrNull(data.message) ?? undefined,
  };
}

export async function fetchCard(cardId: string): Promise<Card> {
  const data = await requestJson<unknown>({
    method: "GET",
    url: `${CARDS_API_PREFIX}/${encodeURIComponent(cardId)}`,
  });
  return normalizeCard(data);
}

export async function fetchCardSensitive(cardId: string): Promise<CardSensitive> {
  const data = await requestJson<Record<string, unknown>>({
    method: "GET",
    url: `${CARDS_API_PREFIX}/${encodeURIComponent(cardId)}/sensitive`,
  });

  return {
    cardId: toStringOrNull(data.cardId) ?? cardId,
    cardNumberFull: toStringOrNull(data.cardNumberFull) ?? "",
    cardCvv: toStringOrNull(data.cardCvv) ?? "",
    expiry: toStringOrNull(data.expiry ?? data.cardExpiry) ?? "",
  };
}

export async function fetchCardLatestOtp(
  cardId: string,
): Promise<CardOtp | null> {
  const data = await requestJson<Record<string, unknown> | null>({
    method: "GET",
    url: `${CARDS_API_PREFIX}/${encodeURIComponent(cardId)}/otp/latest`,
  });

  if (!data) {
    return null;
  }

  return {
    id: toStringOrNull(data.id) ?? "",
    cardId: toStringOrNull(data.cardId) ?? cardId,
    code: toStringOrNull(data.code) ?? "",
    maskedCard: toStringOrNull(data.maskedCard),
    subject: toStringOrNull(data.subject),
    receivedAt: toStringOrNull(data.receivedAt),
    expiresAt: toStringOrNull(data.expiresAt),
    consumedAt: toStringOrNull(data.consumedAt),
  };
}

export async function fetchCardBalance(cardId: string): Promise<CardBalance> {
  const data = await requestJson<Record<string, unknown>>({
    method: "GET",
    url: `${CARDS_API_PREFIX}/${encodeURIComponent(cardId)}/balance`,
  });

  return {
    balance: toStringOrNull(data.balance) ?? "0",
    currency: toStringOrNull(data.currency) ?? "USD",
    fetchedAt: toStringOrNull(data.fetchedAt) ?? "",
  };
}

export async function fetchCardTransactions(
  cardId: string,
  params: CardTransactionsParams = {},
): Promise<CardTransaction[]> {
  const data = await requestJson<unknown[] | { transactions?: unknown[] }>({
    method: "GET",
    url: `${CARDS_API_PREFIX}/${encodeURIComponent(cardId)}/transactions`,
    params,
  });

  const transactions = Array.isArray(data) ? data : data.transactions ?? [];
  return transactions.map((transaction, index) =>
    normalizeCardTransaction(transaction, cardId, index),
  );
}

export async function fetchCardRecharges(
  cardId: string,
  params: PaginatedParams = {},
): Promise<Recharge[]> {
  const data = await requestJson<RechargesListResponse | unknown[]>({
    method: "GET",
    url: `${CARDS_API_PREFIX}/${encodeURIComponent(cardId)}/recharges`,
    params: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  });

  const recharges = Array.isArray(data) ? data : data.recharges;
  return recharges.map(normalizeRecharge);
}

export async function fetchAllCardRecharges(
  params: PaginatedParams = {},
): Promise<Recharge[]> {
  const data = await requestJson<RechargesListResponse>({
    method: "GET",
    url: `${CARDS_API_PREFIX}/recharges`,
    params: {
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
    },
  });

  return data.recharges.map(normalizeRecharge);
}

export async function fetchCardRechargeQuote(
  cardId: string,
  payload: RechargeAmountDto,
): Promise<RechargeQuote> {
  const data = await requestJson<Record<string, unknown>>({
    method: "POST",
    url: `${CARDS_API_PREFIX}/${encodeURIComponent(cardId)}/recharge/quote`,
    data: payload,
  });
  return normalizeRechargeQuote(data, cardId);
}

export async function rechargeCard(
  cardId: string,
  payload: RechargeAmountDto,
): Promise<RechargeResponse> {
  const data = await requestJson<Record<string, unknown>>({
    method: "POST",
    url: `${CARDS_API_PREFIX}/${encodeURIComponent(cardId)}/recharge`,
    data: payload,
  });

  return {
    recharge: normalizeRecharge(data.recharge),
    newBalance: toNumber(data.newBalance) ?? 0,
  };
}

export function isActiveCard(card: Pick<Card, "status">): boolean {
  return card.status === "requested" || card.status === "assigned";
}

function ensureActiveCardsSnapshot(): void {
  if (hasLoadedActiveCardsSnapshot) {
    return;
  }

  hasLoadedActiveCardsSnapshot = true;

  if (typeof window === "undefined") {
    return;
  }

  try {
    const rawValue = window.localStorage.getItem(ACTIVE_CARDS_STORAGE_KEY);
    if (rawValue === "true") {
      cachedHasActiveCards = true;
    } else if (rawValue === "false") {
      cachedHasActiveCards = false;
    }
  } catch {
    // ignore broken cache
  }
}

async function requestHasActiveCards(): Promise<boolean> {
  const cards = await fetchCards();
  const hasActiveCards = cards.some((card) => isActiveCard(card));
  setHasActiveCardsSnapshot(hasActiveCards);
  return hasActiveCards;
}

function persistActiveCardsSnapshot(value: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      ACTIVE_CARDS_STORAGE_KEY,
      value ? "true" : "false",
    );
  } catch {
    // ignore storage errors
  }
}

async function requestJson<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await lumoApi.request<T>(config);
    return response.data;
  } catch (error) {
    throw normalizeRequestError(error, config.url ?? "request");
  }
}

function normalizeCardsConfig(value: unknown): CardsConfig {
  const record = toRecord(value);
  const openingFeeUsdt = toNumber(record.openingFeeUsdt) ?? 0;
  const minInitialDepositUsdt =
    toNumber(record.minInitialDepositUsdt ?? record.minInitialDepositUsd) ?? 0;
  const reserveTotalUsdt =
    toNumber(record.reserveTotalUsdt) ??
    roundToTwo(openingFeeUsdt + minInitialDepositUsdt);
  const rechargeMarkupBps =
    toNumber(record.rechargeMarkupBps ?? record.commissionBps) ?? 0;
  const rechargeMinUsd =
    toNumber(record.rechargeMinUsd ?? record.minRechargeUsd) ?? 0.01;
  const rechargeMaxUsd = toNumber(record.rechargeMaxUsd) ?? 10_000;
  const openingFeeBreakdown = toRecord(record.openingFeeBreakdown);

  return {
    openingFeeUsdt,
    openingFeeBreakdown: {
      lumoFeeUsdt: toNumber(openingFeeBreakdown.lumoFeeUsdt) ?? openingFeeUsdt,
      markupUsdt: toNumber(openingFeeBreakdown.markupUsdt) ?? 0,
    },
    minInitialDepositUsdt,
    reserveTotalUsdt,
    rechargeMarkupBps,
    rechargeMinUsd,
    rechargeMaxUsd,
    minInitialDepositUsd: minInitialDepositUsdt,
    minRechargeUsd: rechargeMinUsd,
    commissionBps: rechargeMarkupBps,
    commissionPercent: rechargeMarkupBps / 100,
    maxCardsPerUser:
      toNumber(record.maxCardsPerUser) ?? DEFAULT_MAX_CARDS_PER_USER,
    testMode: Boolean(record.testMode ?? record.cardsTestMode ?? false),
  };
}

function normalizeCard(value: unknown): Card {
  const record = toRecord(value);
  const status = normalizeCardStatus(record.status);

  return {
    id: toStringOrNull(record.id) ?? "",
    status,
    maskedPan: toStringOrNull(record.maskedPan ?? record.cardNumberMasked),
    expiry: toStringOrNull(record.expiry ?? record.cardExpiry),
    failureReason: toStringOrNull(record.failureReason),
    assignedAt: toStringOrNull(record.assignedAt),
    createdAt: toStringOrNull(record.createdAt) ?? "",
    initialDepositCompleted:
      typeof record.initialDepositCompleted === "boolean"
        ? record.initialDepositCompleted
        : status === "assigned",
  };
}

function normalizeRechargeQuote(
  value: Record<string, unknown>,
  cardId: string,
): RechargeQuote {
  const targetAmountUsd =
    toNumber(value.targetAmountUsd ?? value.targetAmount) ?? 0;
  const commissionUsdt = toNumber(value.commissionUsdt) ?? 0;
  const markupBps = toNumber(value.markupBps) ?? 0;
  const markupUsdt = toNumber(value.markupUsdt ?? value.ourFeeUsdt) ?? 0;
  const totalDebitUsdt =
    toNumber(value.totalDebitUsdt ?? value.userChargeUsdt) ??
    roundToTwo(targetAmountUsd + commissionUsdt + markupUsdt);

  return {
    cardId: toStringOrNull(value.cardId) ?? cardId,
    targetAmountUsd,
    commissionUsdt,
    markupBps,
    markupUsdt,
    totalDebitUsdt,
    availableBalance: toNumber(value.availableBalance) ?? 0,
    sufficient: Boolean(value.sufficient),
  };
}

function normalizeRecharge(value: unknown): Recharge {
  const record = toRecord(value);
  const targetAmountUsd =
    toNumber(record.targetAmountUsd ?? record.targetAmount) ?? 0;
  const commissionUsdt = toNumber(record.commissionUsdt) ?? 0;
  const markupUsdt = toNumber(record.markupUsdt ?? record.ourFeeUsdt) ?? 0;
  const totalDebitUsdt =
    toNumber(record.totalDebitUsdt ?? record.userChargeUsdt) ??
    roundToTwo(targetAmountUsd + commissionUsdt + markupUsdt);
  const purpose = normalizeRechargePurpose(record.purpose);

  return {
    id: toStringOrNull(record.id) ?? "",
    cardId: toStringOrNull(record.cardId) ?? "",
    status: normalizeRechargeStatus(record.status),
    ...(purpose ? { purpose } : {}),
    targetAmountUsd,
    totalDebitUsdt,
    commissionUsdt,
    markupUsdt,
    userChargeUsdt: totalDebitUsdt,
    ourFeeUsdt: roundToTwo(commissionUsdt + markupUsdt),
    failureReason: toStringOrNull(record.failureReason),
    createdAt: toStringOrNull(record.createdAt) ?? "",
  };
}

function normalizeCardTransaction(
  value: unknown,
  cardId: string,
  index: number,
): CardTransaction {
  const record = toRecord(value);
  const transactionTime = toStringOrNull(record.transactionTime) ?? "";
  const id =
    toStringOrNull(record.id ?? record.transactionId) ??
    `${cardId}-${transactionTime || "transaction"}-${index}`;

  return {
    id,
    cardId: toStringOrNull(record.cardId) ?? cardId,
    amount: toStringOrNull(record.amount) ?? "0",
    currency: toStringOrNull(record.currency),
    merchantName: toStringOrNull(record.merchantName),
    typeName: toStringOrNull(record.typeName),
    statusName: toStringOrNull(record.statusName),
    direction: toNumber(record.direction),
    directionName: toStringOrNull(record.directionName),
    transactionTime,
    fee: toStringOrNull(record.fee),
  };
}

function normalizeCardStatus(value: unknown): CardStatus {
  if (
    value === "requested" ||
    value === "assigned" ||
    value === "retired" ||
    value === "failed"
  ) {
    return value;
  }

  return "requested";
}

function normalizeRechargeStatus(value: unknown): RechargeStatus {
  if (
    value === "pending" ||
    value === "pending_debit" ||
    value === "pending_upay" ||
    value === "succeeded" ||
    value === "in_progress_manual" ||
    value === "failed" ||
    value === "refunded"
  ) {
    return value;
  }

  return "pending";
}

function normalizeRechargePurpose(value: unknown): RechargePurpose | undefined {
  if (value === "initial" || value === "user") {
    return value;
  }

  return undefined;
}

function normalizeRequestError(error: unknown, path: string): ApiRequestError {
  if (axios.isAxiosError(error) && error.response) {
    const message =
      extractMessage(error.response.data) ??
      `Request to ${path} failed with status ${error.response.status}`;
    return new ApiRequestError(
      error.response.status,
      message,
      error.response.data,
    );
  }

  if (error instanceof Error && error.message.trim()) {
    return new ApiRequestError(0, error.message.trim());
  }

  return new ApiRequestError(0, `Request to ${path} failed`);
}

function extractMessage(payload: unknown): string | undefined {
  const normalized = normalizeMessageValue(payload);
  if (normalized) {
    return normalized;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const errorMessage = normalizeMessageValue(record.error);
    if (errorMessage) {
      return errorMessage;
    }

    const code = normalizeMessageValue(record.code);
    if (code) {
      return code;
    }
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload.trim();
  }

  return undefined;
}

function normalizeMessageValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => normalizeMessageValue(item))
      .filter((item): item is string => Boolean(item));
    return parts.length > 0 ? parts.join("\n") : undefined;
  }

  if (value && typeof value === "object" && "message" in value) {
    return normalizeMessageValue(value.message);
  }

  return undefined;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", ".").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}
