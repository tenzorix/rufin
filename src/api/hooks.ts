import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import {
  ratesResponseSchema,
  ordersResponseSchema,
  profileResponseSchema,
  submitRequestResponseSchema,
  updateFullnameResponseSchema,
  type SubmitRequestBody,
  type RatesResponse,
  type Order,
  type SubmitRequestResponse,
  type UpdateFullnameBody,
  type UpdateFullnameResponse,
} from "./schemas";
import { useAuthStore } from "@/store/useAuthStore";
import { aggregateProfile } from "../utils/aggregateProfile";

// --- Курсы (публичный) ---

export function useRatesQuery() {
  return useQuery<RatesResponse>({
    queryKey: ["rates"],
    queryFn: async () => {
      const { data } = await api.get("/rates");
      return ratesResponseSchema.parse(data);
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

// --- История заявок ---

export function useOrdersQuery() {
  const telegramUserId = useAuthStore((s) => s.telegramUserId);

  return useQuery<Order[]>({
    queryKey: ["orders", telegramUserId],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${telegramUserId}`);
      return ordersResponseSchema.parse(data);
    },
    enabled: !!telegramUserId,
  });
}

// --- Профиль ---

export function useProfileQuery() {
  const telegramUserId = useAuthStore((s) => s.telegramUserId);

  const ordersQuery = useOrdersQuery();

  const rawProfileQuery = useQuery({
    queryKey: ["profile", telegramUserId],
    queryFn: async () => {
      const { data } = await api.get(`/profile/${telegramUserId}`);
      return profileResponseSchema.parse(data);
    },
    enabled: !!telegramUserId,
  });

  const data = useMemo(
    () =>
      rawProfileQuery.data !== undefined
        ? aggregateProfile(rawProfileQuery.data, ordersQuery.data ?? [])
        : undefined,
    [rawProfileQuery.data, ordersQuery.data]
  );

  return {
    ...rawProfileQuery,
    data,
  };
}

// --- Обновление ФИО (KYC) ---

export function useUpdateFullnameMutation() {
  const queryClient = useQueryClient();
  const telegramUserId = useAuthStore((s) => s.telegramUserId);

  return useMutation<UpdateFullnameResponse, Error, UpdateFullnameBody>({
    mutationFn: async (body) => {
      if (!telegramUserId) {
        throw new Error("Нет telegramUserId");
      }
      const { data } = await api.put(`/users/${telegramUserId}/fullname`, body);
      return updateFullnameResponseSchema.parse(data);
    },
    onSuccess: async () => {
      if (!telegramUserId) return;
      await queryClient.invalidateQueries({ queryKey: ["profile", telegramUserId] });
    },
  });
}

// --- Отправка заявки ---

export function useSubmitRequestMutation() {
  return useMutation<SubmitRequestResponse, Error, SubmitRequestBody>({
    mutationFn: async (body) => {
      const { data } = await api.post("/submit-request", body);
      return submitRequestResponseSchema.parse(data);
    },
  });
}
