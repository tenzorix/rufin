import { apiFetch } from "./client";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly payload?: unknown;

  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.payload = payload;
  }
}

const USERS_API_PREFIX = "/api/users";

export interface InitializeResponse {
  uid?: string;
  balance?: number;
  [key: string]: unknown;
}
export type BalanceResponse = unknown;
export type DepositAddressResponse = unknown;
export type OrdersResponse = unknown;
export type CreateOrderResponse = unknown;
export type OrderStatusResponse = unknown;
export type ReferralTransferResponse = unknown;
export type DepositsResponse = unknown;
export type TransfersResponse = unknown;
export type ReferralStatsResponse = unknown;
export type UserTransferResponse = {
  id: string;
  amount: number;
  status: "success";
  comment: string | null;
  fromUid: string;
  toUid: string;
  recipientFirstName: string | null;
  recipientUsername: string | null;
  createdAt: string;
  newBalance: number;
};

export interface UserTransferRequest {
  recipientUid: string;
  amount: number;
  comment?: string;
}

export interface CreateOrderDisputeAttachment {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  downloadPath: string;
  createdAt: string;
}

export interface CreateOrderDisputeResponse {
  id: string;
  orderId: string;
  traderId: string | null;
  status: "submitted" | string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  attachments: CreateOrderDisputeAttachment[];
}

export interface CreateOrderDisputeRequest {
  comment: string;
  files?: File[];
}

export type EmailCodeResponse = {
  status: "code_sent";
  code: string;
};

export type EmailVerifyResponse = {
  status: "verified";
};

export type EmailStatusResponse = {
  email: string | null;
  state: "none" | "pending" | "verified";
};

export type PinResponse = {
  status: "success";
};

export type PinSettingResponse = {
  status: "success";
};

export function initializeUser(): Promise<InitializeResponse> {
  return fetchJson<InitializeResponse>(`${USERS_API_PREFIX}/initialize`);
}

export function fetchUserBalance(): Promise<BalanceResponse> {
  return fetchJson<BalanceResponse>(`${USERS_API_PREFIX}/balance`);
}

export function fetchDepositAddress(): Promise<DepositAddressResponse> {
  return fetchJson<DepositAddressResponse>(
    `${USERS_API_PREFIX}/deposit-address`
  );
}

export function fetchUserOrders(): Promise<OrdersResponse> {
  return fetchJson<OrdersResponse>(`${USERS_API_PREFIX}/orders`);
}

export function fetchUserDeposits(): Promise<DepositsResponse> {
  return fetchJson<DepositsResponse>(`${USERS_API_PREFIX}/deposits`);
}

export function fetchUserTransfers(): Promise<TransfersResponse> {
  return fetchJson<TransfersResponse>(`${USERS_API_PREFIX}/transfers`);
}

export function transferReferralBalance(
  amount: number
): Promise<ReferralTransferResponse> {
  return fetchJson<ReferralTransferResponse>(
    `${USERS_API_PREFIX}/referral/transfer`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount }),
    }
  );
}

export function transferByUid(
  payload: UserTransferRequest
): Promise<UserTransferResponse> {
  return fetchJson<UserTransferResponse>(`${USERS_API_PREFIX}/transfer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function createOrderDispute(
  orderId: string,
  payload: CreateOrderDisputeRequest
): Promise<CreateOrderDisputeResponse> {
  const formData = new FormData();
  formData.append("comment", payload.comment);
  payload.files?.forEach((file) => {
    formData.append("files", file);
  });

  return fetchJson<CreateOrderDisputeResponse>(
    `${USERS_API_PREFIX}/orders/${orderId}/dispute`,
    {
      method: "POST",
      body: formData,
    }
  );
}

export function fetchReferralStats(): Promise<ReferralStatsResponse> {
  return fetchJson<ReferralStatsResponse>(`${USERS_API_PREFIX}/referral/stats`);
}

export function sendEmailCode(email: string): Promise<EmailCodeResponse> {
  return fetchJson<EmailCodeResponse>(`${USERS_API_PREFIX}/email/code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
}

export function verifyEmailCode(
  email: string,
  code: string
): Promise<EmailVerifyResponse> {
  return fetchJson<EmailVerifyResponse>(`${USERS_API_PREFIX}/email/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code }),
  });
}

export function fetchEmailStatus(): Promise<EmailStatusResponse> {
  return fetchJson<EmailStatusResponse>(`${USERS_API_PREFIX}/email-status`);
}

export function setPin(
  pin: string,
  currentPin?: string
): Promise<PinResponse> {
  return fetchJson<PinResponse>(`${USERS_API_PREFIX}/pin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pin, currentPin }),
  });
}

export function updatePinSetting(enabled: boolean): Promise<PinSettingResponse> {
  return fetchJson<PinSettingResponse>(`${USERS_API_PREFIX}/pin-setting`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ enabled }),
  });
}

const ORDERS_API_PREFIX = "/api/orders";

export function createOrder(qrCode: string): Promise<CreateOrderResponse> {
  return fetchJson<CreateOrderResponse>(ORDERS_API_PREFIX, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ qrCode }),
  });
}

export function acceptOrder(orderId: string): Promise<unknown> {
  return fetchJson(`${ORDERS_API_PREFIX}/${orderId}/accept`, {
    method: "POST",
  });
}

export function fetchOrderStatus(
  orderId: string
): Promise<OrderStatusResponse> {
  return fetchJson<OrderStatusResponse>(
    `${ORDERS_API_PREFIX}/${orderId}/status`
  );
}

async function fetchJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await apiFetch(path, {
    method: "GET",
    ...init,
  });

  const text = await response.text();
  const trimmed = text.trim();
  let payload: unknown =
    trimmed.length > 0 ? safelyParseJson(trimmed, trimmed) : undefined;

  if (!response.ok) {
    const message =
      extractMessage(payload) ??
      `Request to ${path} failed with status ${response.status}`;
    throw new ApiRequestError(response.status, message, payload);
  }

  if (typeof payload === "undefined") {
    payload = {};
  }

  return payload as T;
}

function safelyParseJson(
  value: string,
  fallback: unknown
): Record<string, unknown> | unknown {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return fallback;
  }
}

function extractMessage(payload: unknown): string | undefined {
  const normalized = normalizeMessageValue(payload);
  if (normalized) {
    return normalized;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    const errorMessage = payload.error.trim();
    if (errorMessage) {
      return errorMessage;
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
