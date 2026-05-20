import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { lumoApi } from "./client";
import {
  lumoRatesCurrentResponseSchema,
  type LumoRatesCurrentResponse,
  lumoWalletResponseSchema,
  type LumoWalletResponse,
  lumoBalanceResponseSchema,
  type LumoBalanceResponse,
  lumoBalanceHistoryResponseSchema,
  type LumoBalanceHistoryResponse,
  lumoQrPrepareBodySchema,
  type LumoQrPrepareBody,
  lumoQrPrepareResponseSchema,
  type LumoQrPrepareResponse,
  lumoQrAcceptResponseSchema,
  type LumoQrAcceptResponse,
  lumoQrAcceptInsufficientErrorSchema,
  type LumoQrAcceptInsufficientError,
  lumoQrStatusResponseSchema,
  type LumoQrStatusResponse,
  lumoExchangeOrderBodySchema,
  type LumoExchangeOrderBody,
  lumoExchangeOrderResponseSchema,
  type LumoExchangeOrderResponse,
} from "./lumoSchemas";

// 1) Курс для UI
export function useLumoRatesCurrentQuery() {
  return useQuery<LumoRatesCurrentResponse>({
    queryKey: ["lumo", "rates", "current"],
    queryFn: async () => {
      const { data } = await lumoApi.get("/lumo/rates/current");
      return lumoRatesCurrentResponseSchema.parse(data);
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

// 2) Адрес кошелька для депозитов
export function useLumoWalletQuery() {
  return useQuery<LumoWalletResponse>({
    queryKey: ["lumo", "wallet"],
    queryFn: async () => {
      const { data } = await lumoApi.get("/lumo/wallet");
      return lumoWalletResponseSchema.parse(data);
    },
    staleTime: 10_000,
  });
}

// 3) Баланс
export function useLumoBalanceQuery(options?: { refetchInterval?: number }) {
  return useQuery<LumoBalanceResponse>({
    queryKey: ["lumo", "balance"],
    queryFn: async () => {
      const { data } = await lumoApi.get("/lumo/balance");
      return lumoBalanceResponseSchema.parse(data);
    },
    staleTime: 2_000,
    refetchInterval: options?.refetchInterval,
  });
}

// 4) История баланса
export function useLumoBalanceHistoryQuery(params?: { limit?: number; offset?: number }) {
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;

  return useQuery<LumoBalanceHistoryResponse>({
    queryKey: ["lumo", "balance", "history", limit, offset],
    queryFn: async () => {
      const { data } = await lumoApi.get("/lumo/balance/history", {
        params: { limit, offset },
      });
      return lumoBalanceHistoryResponseSchema.parse(data);
    },
  });
}

// 5.1) Prepare (quote)
export function useLumoQrPrepareMutation() {
  return useMutation<LumoQrPrepareResponse, Error, LumoQrPrepareBody>({
    mutationFn: async (body) => {
      const parsed = lumoQrPrepareBodySchema.parse(body);
      const { data } = await lumoApi.post("/lumo/qr/prepare", parsed);
      return lumoQrPrepareResponseSchema.parse(data);
    },
  });
}

// 5.2) Accept
export function useLumoQrAcceptMutation() {
  return useMutation<
    LumoQrAcceptResponse,
    Error | (Error & { code?: string; details?: LumoQrAcceptInsufficientError }),
    { orderId: string }
  >({
    mutationFn: async ({ orderId }) => {
      try {
        const { data } = await lumoApi.post(`/lumo/qr/${orderId}/accept`);
        return lumoQrAcceptResponseSchema.parse(data);
      } catch (e) {
        if (axios.isAxiosError(e) && e.response) {
          if (e.response.status === 402) {
            const parsed = lumoQrAcceptInsufficientErrorSchema.safeParse(e.response.data);
            const err = new Error("Insufficient balance") as Error & {
              code?: string;
              details?: LumoQrAcceptInsufficientError;
            };
            err.code = "INSUFFICIENT_BALANCE";
            if (parsed.success) err.details = parsed.data;
            throw err;
          }
        }
        throw e as Error;
      }
    },
  });
}

// 5.3) Status polling
export function useLumoQrStatusQuery(orderId: string | null, enabled = true) {
  return useQuery<LumoQrStatusResponse>({
    queryKey: ["lumo", "qr", "status", orderId],
    queryFn: async () => {
      if (!orderId) throw new Error("No orderId");
      const { data } = await lumoApi.get(`/lumo/qr/${orderId}/status`);
      return lumoQrStatusResponseSchema.parse(data);
    },
    enabled: enabled && !!orderId,
    refetchInterval: (q) => {
      const data = q.state.data as LumoQrStatusResponse | undefined;
      if (!data) return 2_500;
      return data.isFinal ? false : 2_500;
    },
  });
}

// 7) Вывод в Rufin (обмен ордер)
export function useLumoExchangeOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation<LumoExchangeOrderResponse, Error, LumoExchangeOrderBody>({
    mutationFn: async (body) => {
      const parsed = lumoExchangeOrderBodySchema.parse(body);
      const { data } = await lumoApi.post("/lumo/exchange-order", parsed);
      return lumoExchangeOrderResponseSchema.parse(data);
    },
    onSuccess: async () => {
      // refresh balance & history in wallet
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["lumo", "balance"] }),
        queryClient.invalidateQueries({ queryKey: ["lumo", "balance", "history"] }),
      ]);
    },
  });
}
