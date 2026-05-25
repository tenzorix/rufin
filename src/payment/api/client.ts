import { getTelegramInitData } from "./telegram";

type EnvRecord = Record<string, string | undefined>;

const isBrowser = typeof window !== "undefined";
const importMetaEnv =
  typeof import.meta !== "undefined"
    ? (import.meta.env as unknown as EnvRecord)
    : undefined;

const ACCESS_COOKIE_NAME = "access_token";
const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "X-CSRF-Token";

const credentialsFlag = readEnvValue([
  "NEXT_PUBLIC_API_WITH_CREDENTIALS",
  "VITE_API_WITH_CREDENTIALS",
]);
const shouldSendCredentials = credentialsFlag === "true";

// Hardcoded backend URL for production
const runtimeBaseUrl = "https://backend-develop-backend.csztvz.easypanel.host";
// https://ru-api.lumowallet.io
// https://backend-develop-backend.csztvz.easypanel.host

export const API_BASE_URL = normalizeBaseUrl(runtimeBaseUrl) || "";

export function apiUrl(path = ""): string {
  if (!path) return API_BASE_URL;
  if (typeof path !== "string") return API_BASE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/${path}`;
}

export function apiFetch(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  const url = apiUrl(path);
  const init: RequestInit = { ...options };
  const headers = new Headers(options?.headers);

  if (shouldSendCredentials) {
    init.credentials = "include";
  }

  if (isBrowser) {
    const token = readCookie(ACCESS_COOKIE_NAME);
    const csrfToken = readCookie(CSRF_COOKIE_NAME);
    const telegramInitData = getTelegramInitData();

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (telegramInitData && !headers.has("X-Telegram-Init-Data")) {
      headers.set("X-Telegram-Init-Data", telegramInitData);
    }

    if (!headers.has("Authorization")) {
      if (telegramInitData) {
        headers.set(
          "Authorization",
          telegramInitData.startsWith("Bearer ")
            ? telegramInitData
            : `Bearer ${telegramInitData}`,
        );
      }
    }

    if (csrfToken && !headers.has(CSRF_HEADER_NAME)) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  init.headers = headers;
  return fetch(url, init);
}

export function getSocketBaseUrl(): string {
  return API_BASE_URL;
}

function readCookie(name: string): string | null {
  if (!isBrowser || typeof document === "undefined") {
    return null;
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${escapedName}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function normalizeBaseUrl(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/\/+$/, "");
}

function readEnvValue(
  keys: string[],
  sources?: Array<EnvRecord | undefined>,
): string | undefined {
  const envSources = sources ?? [importMetaEnv];

  for (const env of envSources) {
    if (!env) continue;
    for (const key of keys) {
      const value = env[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  return undefined;
}
