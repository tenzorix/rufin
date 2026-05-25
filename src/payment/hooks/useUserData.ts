import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ApiRequestError,
  fetchDepositAddress,
  fetchUserBalance,
  fetchUserDeposits,
  fetchUserOrders,
  fetchUserTransfers,
  initializeUser,
} from "../api/users";
import { getTelegramInitData } from "../api/telegram";
import { useI18n } from "../i18n";
import {
  detectUtilityPaymentService,
  type UtilityPaymentService,
} from "../utils/QrDomain";

type AnyRecord = Record<string, unknown>;
type SupportedLanguage = "ru" | "en";

const HISTORY_LABELS: Record<
  | "deposit"
  | "payment"
  | "utilityPayment"
  | "gibddPayment"
  | "bonus"
  | "cashback"
  | "referral"
  | "transferIncoming"
  | "transferOutgoing",
  Record<SupportedLanguage, string>
> = {
  deposit: {
    ru: "Пополнение",
    en: "Deposit",
  },
  bonus: {
    ru: "Бонус",
    en: "Bonus",
  },
  cashback: {
    ru: "Кэшбек",
    en: "Cashback",
  },
  referral: {
    ru: "Реферальная выплата",
    en: "Referral payout",
  },
  payment: {
    ru: "Оплата",
    en: "Payment",
  },
  utilityPayment: {
    ru: "Оплата ЖКХ",
    en: "Utilities payment",
  },
  gibddPayment: {
    ru: "Оплата ГиБДД",
    en: "Traffic fines payment",
  },
  transferIncoming: {
    ru: "Перевод от",
    en: "Transfer from",
  },
  transferOutgoing: {
    ru: "Перевод",
    en: "Transfer",
  },
};

export interface UserProfile {
  id: string;
  uid?: string;
  displayName: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  photoUrl?: string;
  referralBalance?: number;
  referralCode?: string;
}

export interface MoneyViewModel {
  currency: string;
  symbol: string;
  integerPart: string;
  fractionalPart: string | null;
  formatted: string;
  numericAmount: number | null;
}

export interface AccountBalanceViewModel {
  rub: MoneyViewModel;
  usdt: MoneyViewModel;
  rate: number | null;
}

export interface DepositAddressViewModel {
  address: string;
  memo?: string;
  network?: string;
}

export interface HistoryOperationViewModel {
  id: string;
  title: string;
  time: string;
  amount: string;
  amountRub?: string;
  amountUsd?: string;
  amountRubValue?: number | null;
  amountUsdValue?: number | null;
  isPositive: boolean;
  isDeposit?: boolean;
  isTransfer?: boolean;
  depositStatusKind?: "success" | "error" | "processing";
  depositStatusLabel?: string;
  timestampMs?: number | null;
  merchantName?: string;
  transactionId?: string;
  exchangeFromCurrency?: string;
  exchangeToCurrency?: string;
  transferDirection?: "incoming" | "outgoing";
  counterpartyUid?: string;
  depositFromAddress?: string;
  depositAmlStatus?: "passed" | "pending" | "failed";
  orderStatus?: string;
  expiresAtMs?: number | null;
  isUtilityService?: boolean;
  utilityServiceType?: UtilityPaymentService;
}

export interface HistoryGroupViewModel {
  id: string;
  label: string;
  operations: HistoryOperationViewModel[];
}

interface UserDataState {
  loading: boolean;
  error: string | null;
  authMissing: boolean;
  profile: UserProfile | null;
  balance: AccountBalanceViewModel | null;
  cashbackBalance: AccountBalanceViewModel | null;
  depositAddress: DepositAddressViewModel | null;
  history: HistoryGroupViewModel[];
}

type ApiSourceKey =
  | "initialize"
  | "balance"
  | "deposit"
  | "orders"
  | "deposits"
  | "transfers";

const API_LABELS: Record<ApiSourceKey, string> = {
  initialize: "Initialization",
  balance: "Balance",
  deposit: "Deposit address",
  orders: "History",
  deposits: "Deposits",
  transfers: "Transfers",
};

const AUTH_HINT =
  "Telegram init data is missing. Open the app inside Telegram or set VITE_TELEGRAM_INIT_DATA for local testing.";
const FALLBACK_ERROR = "Unable to load data right now. Please try again later.";

const initialState: UserDataState = {
  loading: true,
  error: null,
  authMissing: false,
  profile: null,
  balance: null,
  cashbackBalance: null,
  depositAddress: null,
  history: [],
};

export function useUserData() {
  const [state, setState] = useState<UserDataState>(initialState);
  const isFetchingRef = useRef(false);

  const { language } = useI18n();

  const applyState = useCallback((next: UserDataState) => {
    setState(next);
  }, []);

  const fetchAll = useCallback(
    async (force = false) => {
      if (!force && isFetchingRef.current) {
        return;
      }
      isFetchingRef.current = true;

      try {
        const authData = getTelegramInitData();
        if (!authData) {
          applyState({
            ...initialState,
            loading: false,
            authMissing: true,
            error: AUTH_HINT,
          });
          return;
        }

        setState((previousState) => ({
          ...previousState,
          loading: true,
          authMissing: false,
          error: null,
        }));

        const [
          initializeResult,
          balanceResult,
          depositResult,
          ordersResult,
          depositsResult,
          transfersResult,
        ] = await Promise.allSettled([
          initializeUser(),
          fetchUserBalance(),
          fetchDepositAddress(),
          fetchUserOrders(),
          fetchUserDeposits(),
          fetchUserTransfers(),
        ]);

        const errors: string[] = [];

        const profile =
          initializeResult.status === "fulfilled"
            ? normalizeProfile(initializeResult.value)
            : (errors.push(
                formatRequestError("initialize", initializeResult.reason)
              ),
              null);

        const balance =
          balanceResult.status === "fulfilled"
            ? normalizeBalance(balanceResult.value)
            : (errors.push(formatRequestError("balance", balanceResult.reason)),
              null);

        const cashbackBalance =
          initializeResult.status === "fulfilled"
            ? normalizeCashbackBalance(
                initializeResult.value,
                balance?.rate ?? null
              )
            : null;

        const depositAddress =
          depositResult.status === "fulfilled"
            ? normalizeDepositAddress(depositResult.value)
            : (errors.push(formatRequestError("deposit", depositResult.reason)),
              null);

        const ordersNormalized =
          ordersResult.status === "fulfilled"
            ? normalizeOrders(ordersResult.value, language)
            : (errors.push(formatRequestError("orders", ordersResult.reason)),
              []);

        const depositsNormalized =
          depositsResult.status === "fulfilled"
            ? normalizeDeposits(depositsResult.value, language)
            : (errors.push(
                formatRequestError("deposits", depositsResult.reason)
              ),
              []);

        const transfersNormalized =
          transfersResult.status === "fulfilled"
            ? normalizeTransfers(
                transfersResult.value,
                language,
                balance?.rate ?? null,
                profile?.uid ?? null
              )
            : (errors.push(
                formatRequestError("transfers", transfersResult.reason)
              ),
              []);

        const history = buildHistory(
          [...ordersNormalized, ...depositsNormalized, ...transfersNormalized],
          language
        );

        publishDebugPayload({
          initialize: initializeResult,
          balance: balanceResult,
          deposit: depositResult,
          orders: ordersResult,
          transfers: transfersResult,
        });

        const nextState: UserDataState = {
          loading: false,
          authMissing: false,
          error: errors.filter(Boolean).length ? errors.join(". ") : null,
          profile,
          balance,
          cashbackBalance,
          depositAddress,
          history,
        };

        applyState(nextState);
      } finally {
        isFetchingRef.current = false;
      }
    },
    [applyState, language]
  );

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const refresh = useCallback(() => {
    void fetchAll(true);
  }, [fetchAll]);

  const memoizedState = useMemo(
    () => ({
      ...state,
      refresh,
    }),
    [state, refresh]
  );

  return memoizedState;
}

function normalizeProfile(payload: unknown): UserProfile | null {
  const rootSource = isRecord(payload) ? payload : undefined;
  const source =
    unwrapRecord(payload, [
      "user",
      "profile",
      "telegramUser",
      "data",
      "result",
      "payload",
    ]) ?? rootSource;

  if (!source) {
    return null;
  }

  const uidNumber =
    readNumber(source, ["uid"]) ?? readNumber(rootSource, ["uid"]);
  const uid =
    readString(source, ["uid"]) ??
    readString(rootSource, ["uid"]) ??
    (typeof uidNumber === "number" && Number.isFinite(uidNumber)
      ? String(Math.trunc(uidNumber))
      : undefined);

  const id =
    readString(source, ["id", "user_id", "userId"]) ??
    readString(rootSource, ["id", "user_id", "userId"]) ??
    String(
      readNumber(source, ["id", "user_id", "userId"]) ??
        readNumber(rootSource, ["id", "user_id", "userId"]) ??
        uid ??
        cryptoRandomId("usr")
    );

  const firstName = readString(source, [
    "first_name",
    "firstName",
    "first",
    "name",
  ]);
  const lastName = readString(source, ["last_name", "lastName"]);
  const username = readString(source, ["username", "login", "nick"]);
  const languageCode = readString(source, ["language_code", "languageCode"]);
  const photoUrl = readString(source, [
    "photo_url",
    "photoUrl",
    "avatar",
    "avatarUrl",
    "picture",
    "image",
  ]);
  const referralBalance = readNumber(source, [
    "referralBalance",
    "referral_balance",
    "refBalance",
    "ref_balance",
    "referral",
  ]);
  const referralCode = readString(source, [
    "referralCode",
    "referral_code",
    "refCode",
    "ref_code",
    "ref",
  ]);

  const displayName =
    [firstName, lastName].filter(Boolean).join(" ").trim() || username || id;

  return {
    id,
    uid: uid ?? undefined,
    displayName,
    username: username ?? undefined,
    firstName: firstName ?? undefined,
    lastName: lastName ?? undefined,
    languageCode: languageCode ?? undefined,
    photoUrl: photoUrl ?? undefined,
    referralBalance: referralBalance ?? undefined,
    referralCode: referralCode ?? undefined,
  };
}

function normalizeBalance(payload: unknown): AccountBalanceViewModel | null {
  const source =
    unwrapRecord(payload, ["balance", "data", "result", "payload"]) ??
    (isRecord(payload) ? payload : undefined);

  if (!source) {
    return null;
  }

  const rawRubAmount = readNumber(source, [
    "balanceRub",
    "rubBalance",
    "balance_rub",
    "balanceFiat",
    "fiatAmount",
    "fiat_amount",
    "amount",
    "balance",
  ]);
  const rawUsdtAmount = readNumber(source, [
    "balanceUsdt",
    "usdtBalance",
    "balance_usdt",
    "balanceCrypto",
    "cryptoAmount",
    "usdt_amount",
  ]);
  const rateValue = readNumber(source, ["rate", "usdtRate", "price", "quote"]);

  const resolvedRub =
    typeof rawRubAmount === "number"
      ? rawRubAmount
      : typeof rawUsdtAmount === "number" && typeof rateValue === "number"
      ? rawUsdtAmount * rateValue
      : undefined;

  const resolvedUsdt =
    typeof rawUsdtAmount === "number"
      ? rawUsdtAmount
      : typeof rawRubAmount === "number" && typeof rateValue === "number"
      ? rawRubAmount / rateValue
      : undefined;

  return {
    rub: createMoneyViewModel(resolvedRub, "RUB"),
    usdt: createMoneyViewModel(resolvedUsdt, "USDT"),
    rate:
      typeof rateValue === "number" && Number.isFinite(rateValue)
        ? rateValue
        : null,
  };
}

function normalizeCashbackBalance(
  payload: unknown,
  rate: number | null
): AccountBalanceViewModel | null {
  const source =
    unwrapRecord(payload, [
      "user",
      "profile",
      "telegramUser",
      "data",
      "result",
      "payload",
    ]) ?? (isRecord(payload) ? payload : undefined);

  if (!source) {
    return null;
  }

  const rawCashbackAmount = readNumber(source, [
    "cashbackBalance",
    "cashback_balance",
    "cashback",
  ]);

  if (typeof rawCashbackAmount !== "number") {
    return null;
  }

  // cashbackBalance приходит в USDT, конвертируем в рубли используя rate из balance
  const resolvedUsdt = rawCashbackAmount;
  const resolvedRub =
    typeof rate === "number" && Number.isFinite(rate) && rate > 0
      ? rawCashbackAmount * rate
      : undefined;

  return {
    rub: createMoneyViewModel(resolvedRub, "RUB"),
    usdt: createMoneyViewModel(resolvedUsdt, "USDT"),
    rate,
  };
}

function normalizeDepositAddress(
  payload: unknown
): DepositAddressViewModel | null {
  const source =
    unwrapRecord(payload, [
      "deposit",
      "address",
      "data",
      "result",
      "payload",
    ]) ?? (isRecord(payload) ? payload : undefined);

  if (!source) {
    return null;
  }

  const address = readString(source, [
    "address",
    "wallet",
    "account",
    "value",
    "deposit_address",
    "depositAddress",
  ]);

  if (!address) {
    return null;
  }

  const memo = readString(source, ["memo", "tag", "comment", "payment_id"]);
  const network = readString(source, ["network", "chain", "blockchain"]);

  return {
    address,
    memo: memo ?? undefined,
    network: network ?? undefined,
  };
}

interface NormalizedOrder {
  id: string;
  title: string;
  time: string;
  dayKey: string;
  timestampMs: number | null;
  amountDisplay: string;
  amountDisplayRub?: string;
  amountDisplayUsd?: string;
  amountRubValue?: number | null;
  amountUsdValue?: number | null;
  isPositive: boolean;
  isDeposit?: boolean;
  isTransfer?: boolean;
  depositStatusKind?: "success" | "error" | "processing";
  depositStatusLabel?: string;
  merchantName?: string;
  transactionId?: string;
  exchangeFromCurrency?: string;
  exchangeToCurrency?: string;
  transferDirection?: "incoming" | "outgoing";
  counterpartyUid?: string;
  depositFromAddress?: string;
  depositAmlStatus?: "passed" | "pending" | "failed";
  orderStatus?: string;
  expiresAtMs?: number | null;
  isUtilityService?: boolean;
  utilityServiceType?: UtilityPaymentService;
}

function normalizeOrders(
  payload: unknown,
  lang: SupportedLanguage
): NormalizedOrder[] {
  const collection =
    unwrapArray(payload, ["orders", "history", "items", "list", "data"]) ?? [];

  const result: NormalizedOrder[] = [];

  collection.forEach((item, index) => {
    const normalized = normalizeOrder(item, index, lang);
    if (normalized) {
      result.push(normalized);
    }
  });

  return result;
}

function normalizeDeposits(
  payload: unknown,
  lang: SupportedLanguage
): NormalizedOrder[] {
  const collection =
    unwrapArray(payload, ["deposits", "items", "list", "data"]) ?? [];

  const result: NormalizedOrder[] = [];

  collection.forEach((item, index) => {
    if (!isRecord(item)) {
      return;
    }

    const id =
      readString(item, ["id", "deposit_id", "depositId"]) ??
      String(
        readNumber(item, ["id", "deposit_id", "depositId"]) ??
          cryptoRandomId(`deposit-${index}`)
      );

    const amount = readNumber(item, [
      "amount",
      "value",
      "fiat_amount",
      "fiatAmount",
      "sum",
    ]);

    const timestampValue =
      readUnknown(item, [
        "created_at",
        "createdAt",
        "updated_at",
        "updatedAt",
        "blockTimestamp",
        "timestamp",
        "time",
        "date",
      ]) ?? null;

    const timestamp = parseDate(timestampValue);
    const timestampMs = timestamp?.getTime() ?? null;
    const timeLabel = timestamp ? formatTime(timestamp, lang) : "—:—";
    const dayKey = timestamp
      ? `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}`
      : cryptoRandomId("day-deposit");

    const amountDisplay = formatMoney(amount, "USD");
    const txHash = readString(item, ["txHash", "tx_hash", "transactionHash"]);
    const fromAddress = readString(item, [
      "fromAddress",
      "from_address",
      "senderAddress",
      "sender_address",
    ]);
    const isReferral = txHash === "referral";
    const isCashback = txHash === "cashback";
    const isBonus = txHash === "bonus";
    const rawStatus = readString(item, ["status", "state", "result"]);
    const amlStatus = resolveDepositAmlStatus(rawStatus);
    const depositStatusKind: NormalizedOrder["depositStatusKind"] =
      amlStatus === "passed"
        ? "success"
        : amlStatus === "failed"
        ? "error"
        : "processing";

    const depositStatusLabel = isReferral
      ? HISTORY_LABELS.referral[lang]
      : isCashback
      ? HISTORY_LABELS.cashback[lang]
      : isBonus
      ? HISTORY_LABELS.bonus[lang]
      : depositStatusKind === "success"
      ? lang === "en"
        ? "Deposit"
        : "Пополнение"
      : depositStatusKind === "error"
      ? lang === "en"
        ? "Error"
        : "Ошибка"
      : lang === "en"
      ? "Processing"
      : "В обработке";

    result.push({
      id,
      title: depositStatusLabel,
      time: timeLabel,
      dayKey,
      timestampMs,
      amountDisplay,
      amountDisplayUsd: amountDisplay,
      amountUsdValue: amount ?? null,
      isPositive: true,
      isDeposit: true,
      depositStatusKind,
      depositStatusLabel,
      transactionId: txHash ?? id,
      exchangeFromCurrency: "USDT",
      exchangeToCurrency: "USDT",
      depositFromAddress: fromAddress ?? undefined,
      depositAmlStatus: amlStatus,
    });
  });

  return result;
}

function normalizeTransfers(
  payload: unknown,
  lang: SupportedLanguage,
  rate: number | null,
  currentUserUid: string | null
): NormalizedOrder[] {
  const collection =
    unwrapArray(payload, ["transfers", "items", "list", "data"]) ?? [];

  const result: NormalizedOrder[] = [];

  collection.forEach((item, index) => {
    if (!isRecord(item)) {
      return;
    }

    const id =
      readString(item, ["id", "transfer_id", "transferId"]) ??
      String(
        readNumber(item, ["id", "transfer_id", "transferId"]) ??
          cryptoRandomId(`transfer-${index}`)
      );

    const amount = readNumber(item, ["amount", "value", "sum"]);
    const fromUid = readString(item, ["fromUid", "from_uid", "senderUid"]);
    const toUid = readString(item, ["toUid", "to_uid", "recipientUid"]);
    const directionRaw = readString(item, ["direction", "type"]);
    const direction = resolveTransferDirection(
      directionRaw,
      fromUid,
      toUid,
      currentUserUid
    );
    const isIncoming = direction === "incoming";

    const timestampValue =
      readUnknown(item, [
        "createdAt",
        "created_at",
        "timestamp",
        "time",
        "date",
      ]) ?? null;

    const timestamp = parseDate(timestampValue);
    const timestampMs = timestamp?.getTime() ?? null;
    const timeLabel = timestamp ? formatTime(timestamp, lang) : "—:—";
    const dayKey = timestamp ? formatDayKey(timestamp) : `transfer-${index}`;

    const amountDisplayUsd = formatHistoryAmount(amount, "USDT", isIncoming);
    const amountRubValue =
      typeof amount === "number" &&
      typeof rate === "number" &&
      Number.isFinite(rate) &&
      rate > 0
        ? amount * rate
        : undefined;
    const amountDisplayRub =
      typeof amountRubValue === "number"
        ? formatHistoryAmount(amountRubValue, "RUB", isIncoming)
        : undefined;

    const counterpartyUid =
      (isIncoming ? fromUid : toUid) ??
      readString(item, ["counterpartyUid", "counterparty_uid", "uid"]);
    const counterpartyFirstName = isIncoming
      ? readString(item, [
          "senderFirstName",
          "sender_first_name",
          "fromFirstName",
          "from_first_name",
          "counterpartyFirstName",
          "counterparty_first_name",
          "firstName",
          "first_name",
        ])
      : readString(item, [
          "recipientFirstName",
          "recipient_first_name",
          "toFirstName",
          "to_first_name",
          "counterpartyFirstName",
          "counterparty_first_name",
          "firstName",
          "first_name",
        ]);
    const counterpartyUsername = isIncoming
      ? readString(item, [
          "senderUsername",
          "sender_username",
          "fromUsername",
          "from_username",
          "counterpartyUsername",
          "counterparty_username",
          "username",
        ])
      : readString(item, [
          "recipientUsername",
          "recipient_username",
          "toUsername",
          "to_username",
          "counterpartyUsername",
          "counterparty_username",
          "username",
        ]);
    const counterpartyLabel =
      (counterpartyUsername ? `@${counterpartyUsername}` : null) ??
      counterpartyFirstName ??
      (counterpartyUid ? `UID ${counterpartyUid}` : null);
    const titlePrefix = isIncoming
      ? HISTORY_LABELS.transferIncoming[lang]
      : HISTORY_LABELS.transferOutgoing[lang];
    const title = counterpartyLabel
      ? `${titlePrefix} ${counterpartyLabel}`
      : titlePrefix;
    const transactionId =
      readString(item, [
        "transaction_id",
        "transactionId",
        "txHash",
        "tx_hash",
        "transactionHash",
        "transferHash",
        "hash",
      ]) ?? id;

    result.push({
      id,
      title,
      time: timeLabel,
      dayKey,
      timestampMs,
      amountDisplay: amountDisplayUsd,
      amountDisplayUsd: amountDisplayUsd,
      amountDisplayRub,
      amountUsdValue: amount ?? null,
      amountRubValue: amountRubValue ?? null,
      isPositive: isIncoming,
      isDeposit: false,
      isTransfer: true,
      transactionId,
      exchangeFromCurrency: "USDT",
      exchangeToCurrency: "USDT",
      transferDirection: direction,
      counterpartyUid: counterpartyUid ?? undefined,
    });
  });

  return result;
}

function resolveDepositAmlStatus(
  rawStatus: string | undefined
): "passed" | "pending" | "failed" {
  const normalizedStatus = rawStatus?.trim().toLowerCase();

  if (
    normalizedStatus === "credited" ||
    normalizedStatus === "success" ||
    normalizedStatus === "completed"
  ) {
    return "passed";
  }

  if (
    normalizedStatus === "aml_fail" ||
    normalizedStatus === "blocked" ||
    normalizedStatus === "error" ||
    normalizedStatus === "failed"
  ) {
    return "failed";
  }

  return "pending";
}

function resolveTransferDirection(
  rawDirection: string | undefined,
  fromUid: string | undefined,
  toUid: string | undefined,
  currentUserUid: string | null
): "incoming" | "outgoing" {
  const normalizedDirection = rawDirection?.trim().toLowerCase();
  if (
    normalizedDirection === "incoming" ||
    normalizedDirection === "in" ||
    normalizedDirection === "credit"
  ) {
    return "incoming";
  }

  if (
    normalizedDirection === "outgoing" ||
    normalizedDirection === "out" ||
    normalizedDirection === "debit"
  ) {
    return "outgoing";
  }

  if (currentUserUid) {
    if (toUid === currentUserUid) {
      return "incoming";
    }
    if (fromUid === currentUserUid) {
      return "outgoing";
    }
  }

  return "outgoing";
}

function normalizeOrder(
  item: unknown,
  index: number,
  lang: SupportedLanguage
): NormalizedOrder | null {
  if (!isRecord(item)) {
    return null;
  }

  const id =
    readString(item, ["id", "order_id", "orderId", "external_id"]) ??
    String(
      readNumber(item, ["id", "order_id", "orderId"]) ??
        cryptoRandomId(`order-${index}`)
    );

  const amount = readNumber(item, [
    "amount",
    "value",
    "total",
    "fiat_amount",
    "fiatAmount",
  ]);
  const amountRubValue = readNumber(item, [
    "amountRub",
    "amount_rub",
    "fiat_amount",
    "fiatAmount",
    "amount",
  ]);
  const currency =
    readString(item, ["currency", "fiat_currency", "fiatCurrency"]) ?? "USD";
  const exchangeFromCurrency = normalizeCurrencyCode(
    readString(item, [
      "crypto_currency",
      "cryptoCurrency",
      "asset",
      "base_currency",
      "baseCurrency",
      "from_currency",
      "fromCurrency",
      "amount_currency",
      "amountCurrency",
    ]) ?? "USDT"
  );
  const exchangeToCurrency = normalizeCurrencyCode(
    readString(item, [
      "fiat_currency",
      "fiatCurrency",
      "to_currency",
      "toCurrency",
      "currency",
      "currency_to",
      "currencyTo",
    ]) ?? "RUB"
  );
  const nspkBrandName = readString(item, [
    "nspkBrandName",
    "nspk_brand_name",
    "nspk_brand",
  ]);
  const merchantName =
    nspkBrandName ??
    readString(item, [
      "merchantName",
      "merchant_name",
      "seller",
      "seller_name",
      "store",
      "shop",
      "company",
    ]);
  const transactionId =
    readString(item, [
      "transaction_id",
      "transactionId",
      "txHash",
      "tx_hash",
      "transactionHash",
      "payment_id",
      "paymentId",
      "hash",
    ]) ?? id;
  const qrCode = readString(item, [
    "qrCode",
    "qr_code",
    "rawQr",
    "raw_qr",
    "sourceQr",
    "source_qr",
  ]);
  const utilityServiceType = detectUtilityPaymentService(qrCode);
  const isUtilityService = Boolean(utilityServiceType);
  const description = utilityServiceType === "gibdd"
    ? HISTORY_LABELS.gibddPayment[lang]
    : isUtilityService
    ? HISTORY_LABELS.utilityPayment[lang]
    : merchantName ?? HISTORY_LABELS.payment[lang];
  const orderStatus = readString(item, [
    "status",
    "order_status",
    "orderStatus",
    "state",
    "result",
  ])?.toLowerCase();
  const expiresAtValue = readUnknown(item, [
    "expiresAt",
    "expires_at",
    "expireAt",
    "expire_at",
    "expiredAt",
    "expired_at",
  ]);
  const expiresAt = parseDate(expiresAtValue);
  const expiresAtMs = expiresAt?.getTime() ?? null;

  const timestampValue =
    readUnknown(item, [
      "created_at",
      "createdAt",
      "completed_at",
      "completedAt",
      "updated_at",
      "updatedAt",
      "timestamp",
      "time",
      "date",
    ]) ?? null;

  const timestamp = parseDate(timestampValue);
  const timestampMs = timestamp?.getTime() ?? null;
  const timeLabel = timestamp ? formatTime(timestamp, lang) : "—:—";
  const dayKey = timestamp ? formatDayKey(timestamp) : `unknown-${index}`;
  const isPositive = false;
  const amountDisplayRub = formatHistoryAmount(
    amountRubValue,
    "RUB",
    isPositive
  );
  const amountDisplayUsd = formatHistoryAmount(amount, "USD", isPositive);
  const amountDisplay =
    amountDisplayRub ??
    amountDisplayUsd ??
    formatHistoryAmount(amount, currency, isPositive);

  return {
    id,
    title: description,
    time: timeLabel,
    dayKey,
    timestampMs,
    amountDisplay,
    amountDisplayRub,
    amountDisplayUsd,
    amountRubValue: amountRubValue ?? null,
    amountUsdValue: amount ?? null,
    isPositive,
    merchantName: merchantName ?? undefined,
    transactionId,
    exchangeFromCurrency,
    exchangeToCurrency,
    orderStatus: orderStatus ?? undefined,
    expiresAtMs,
    isUtilityService,
    utilityServiceType: utilityServiceType ?? undefined,
  };
}

function buildHistory(
  orders: NormalizedOrder[],
  lang: SupportedLanguage
): HistoryGroupViewModel[] {
  if (!orders.length) {
    return [];
  }

  if (import.meta.env.DEV) {
    console.info("[userApi] Orders response:", orders);
  }

  const sorted = [...orders].sort(
    (a, b) => (b.timestampMs ?? 0) - (a.timestampMs ?? 0)
  );

  const groups = new Map<string, HistoryGroupViewModel>();

  sorted.forEach((order) => {
    const addPlus = (value: string | undefined) => {
      if (!value) return value;
      if (value.startsWith("+") || value.startsWith("-")) return value;
      return `+${value}`;
    };

    const existing = groups.get(order.dayKey);
    const operation: HistoryOperationViewModel = {
      id: order.id,
      title: order.title,
      time: order.time,
      amount: order.isDeposit
        ? addPlus(order.amountDisplay) ?? order.amountDisplay
        : order.amountDisplay,
      amountRub: order.isDeposit
        ? addPlus(order.amountDisplayRub)
        : order.amountDisplayRub,
      amountUsd: order.isDeposit
        ? addPlus(order.amountDisplayUsd)
        : order.amountDisplayUsd,
      amountRubValue: order.amountRubValue,
      amountUsdValue: order.amountUsdValue,
      isPositive: order.isPositive,
      isDeposit: order.isDeposit,
      isTransfer: order.isTransfer,
      depositStatusKind: order.depositStatusKind,
      depositStatusLabel: order.depositStatusLabel,
      timestampMs: order.timestampMs,
      merchantName: order.merchantName,
      transactionId: order.transactionId,
      exchangeFromCurrency: order.exchangeFromCurrency,
      exchangeToCurrency: order.exchangeToCurrency,
      transferDirection: order.transferDirection,
      counterpartyUid: order.counterpartyUid,
      depositFromAddress: order.depositFromAddress,
      depositAmlStatus: order.depositAmlStatus,
      orderStatus: order.orderStatus,
      expiresAtMs: order.expiresAtMs,
      isUtilityService: order.isUtilityService,
      utilityServiceType: order.utilityServiceType,
    };

    if (existing) {
      existing.operations.push(operation);
      return;
    }

    const label = order.timestampMs
      ? formatDayLabel(new Date(order.timestampMs), lang)
      : lang === "en"
      ? "No date"
      : "Без даты";

    groups.set(order.dayKey, {
      id: order.dayKey,
      label,
      operations: [operation],
    });
  });

  return Array.from(groups.values());
}

function formatRequestError(source: ApiSourceKey, error: unknown): string {
  const label = API_LABELS[source];
  if (error instanceof ApiRequestError) {
    return `${label}: ${error.message}`;
  }
  if (error instanceof Error) {
    return `${label}: ${error.message}`;
  }
  return `${label}: ${FALLBACK_ERROR}`;
}

function publishDebugPayload(payloads: Record<string, unknown>): void {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return;
  }

  const resolvedPayloads: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payloads)) {
    resolvedPayloads[key] =
      value && typeof value === "object" && "status" in value
        ? value
        : { status: "fulfilled", value };
  }

  console.debug("[userApi]", resolvedPayloads);
}

function unwrapRecord(
  payload: unknown,
  keys: string[],
  visited = new Set<AnyRecord>()
): AnyRecord | undefined {
  if (!isRecord(payload) || visited.has(payload)) {
    return undefined;
  }
  visited.add(payload);

  for (const key of keys) {
    const candidate = payload[key];
    if (isRecord(candidate)) {
      const nested = unwrapRecord(candidate, keys, visited);
      return nested ?? candidate;
    }
  }

  return payload;
}

function unwrapArray(
  payload: unknown,
  keys: string[],
  visited = new Set<AnyRecord>()
): unknown[] | undefined {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload) || visited.has(payload)) {
    return undefined;
  }

  visited.add(payload);

  for (const key of keys) {
    const candidate = payload[key];
    const nested = unwrapArray(candidate, keys, visited);
    if (nested) {
      return nested;
    }
  }

  return undefined;
}

function readString(
  source: AnyRecord | undefined,
  keys: string[]
): string | undefined {
  if (!source) {
    return undefined;
  }
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function readNumber(
  source: AnyRecord | undefined,
  keys: string[]
): number | undefined {
  if (!source) {
    return undefined;
  }
  for (const key of keys) {
    const value = source[key];
    const parsed = coerceNumber(value);
    if (typeof parsed === "number") {
      return parsed;
    }
  }
  return undefined;
}

function readUnknown(
  source: AnyRecord | undefined,
  keys: string[]
): unknown | undefined {
  if (!source) {
    return undefined;
  }
  for (const key of keys) {
    if (key in source) {
      return source[key];
    }
  }
  return undefined;
}

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const normalized = value
      .replace(/[^\d.,-]/g, "")
      .replace(",", ".")
      .trim();
    if (!normalized) {
      return undefined;
    }
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function createMoneyViewModel(
  value: number | undefined,
  currency: string
): MoneyViewModel {
  const parts = splitAmountParts(value, currency);
  return {
    currency,
    symbol: parts.symbol,
    integerPart: parts.integerPart,
    fractionalPart: parts.fractionalPart,
    formatted: formatMoney(value, currency),
    numericAmount:
      typeof value === "number" && Number.isFinite(value) ? value : null,
  };
}

function splitAmountParts(
  value: number | undefined,
  currency: string
): {
  integerPart: string;
  fractionalPart: string | null;
  symbol: string;
} {
  const symbol = currencySymbol(currency);
  if (typeof value !== "number" || Number.isNaN(value)) {
    return {
      integerPart: "—",
      fractionalPart: null,
      symbol,
    };
  }

  const formatter = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formatted = formatter.format(Math.abs(value)).replace(/\u00A0/g, " ");
  const [integerPartRaw, fractionalDigits] = formatted.split(",");
  const integerPart = `${value < 0 ? "-" : ""}${integerPartRaw ?? "0"}`;

  return {
    integerPart,
    fractionalPart: fractionalDigits ? `.${fractionalDigits}` : null,
    symbol,
  };
}

function formatMoney(value: number | undefined, currency: string): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return currencySymbol(currency);
  }
  const formatter = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const base = formatter.format(Math.abs(value)).replace(/\u00A0/g, " ");
  const sign = value < 0 ? "-" : "";
  const symbol = currencySymbol(currency);
  const suffix = symbol.length === 1 ? symbol : ` ${symbol}`;
  return `${sign}${base}${suffix}`;
}

function currencySymbol(currency: string): string {
  switch (normalizeCurrencyCode(currency)) {
    case "RUB":
      return "₽";
    case "USD":
    case "USDT":
      return "$";
    case "EUR":
      return "€";
    default:
      return normalizeCurrencyCode(currency);
  }
}

function normalizeCurrencyCode(currency: string): string {
  const normalized = currency.trim().toUpperCase();
  if (normalized === "RUR") {
    return "RUB";
  }
  return normalized;
}

function formatHistoryAmount(
  amount: number | undefined,
  currency: string,
  isPositive: boolean
): string {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return currencySymbol(currency);
  }
  const formatter = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const absolute = formatter.format(Math.abs(amount)).replace(/\u00A0/g, " ");
  const symbol = currencySymbol(currency);
  const suffix = symbol.length === 1 ? symbol : ` ${symbol}`;
  return `${isPositive ? "+" : "-"}${absolute}${suffix}`;
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(normalizeTimestamp(value));
  }

  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value);
    if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
      return new Date(normalizeTimestamp(numeric));
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function normalizeTimestamp(value: number): number {
  if (value > 1e12) {
    return value;
  }
  if (value > 1e9) {
    return value * 1000;
  }
  return value;
}

function formatTime(date: Date, lang: SupportedLanguage): string {
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDayLabel(date: Date, lang: SupportedLanguage = "ru"): string {
  return new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "ru-RU", {
    day: "numeric",
    month: "long",
  }).format(date);
}

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cryptoRandomId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Math.random().toString(16).slice(2, 10)}`;
}
