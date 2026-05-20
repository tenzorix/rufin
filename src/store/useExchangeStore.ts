import { create } from "zustand";
import {
  calculateOutputAmount,
  getRateByDirection,
  parseAmount,
} from "@/utils/exchangeCalculations";

export type ExchangeDirection = "BUY" | "SELL";

type ExchangeDraft = {
  direction: ExchangeDirection;
  rate: number;
  amount: number;
  fromWithdraw?: boolean;
};

type ExchangeStore = {
  draft: ExchangeDraft | null;
  setDraft: (draft: ExchangeDraft) => void;
  clearDraft: () => void;
  getOutputAmount: () => number;
  // Form state
  fromAmount: string;
  direction: ExchangeDirection;
  buyRate: number;
  sellRate: number;
  setFromAmount: (v: string) => void;
  setDirection: (v: ExchangeDirection | ((p: ExchangeDirection) => ExchangeDirection)) => void;
  setRates: (buyRate: number, sellRate: number) => void;
  submit: (opts?: { fromWithdraw?: boolean }) => void;
  swap: () => void;
};

export const useExchangeStore = create<ExchangeStore>((set, get) => ({
  draft: null,
  fromAmount: "",
  direction: "BUY",
  buyRate: 0,
  sellRate: 0,

  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null, fromAmount: "" }),

  setFromAmount: (v) => set({ fromAmount: v }),
  setDirection: (v) =>
    set((s) => {
      const nextDirection = typeof v === "function" ? v(s.direction) : v;
      if (nextDirection === s.direction) return { direction: nextDirection };
      return { direction: nextDirection, fromAmount: "" };
    }),
  setRates: (buyRate, sellRate) => set({ buyRate, sellRate }),

  getOutputAmount: () => {
    const { draft } = get();
    if (!draft) return 0;

    const sellCommissionUsd = draft.fromWithdraw && draft.direction === "SELL" ? 0 : undefined;
    return calculateOutputAmount({
      amount: draft.amount,
      direction: draft.direction,
      rate: draft.rate,
      sellCommissionUsd,
    });
  },

  submit: (opts?: { fromWithdraw?: boolean }) => {
    const { fromAmount, direction, buyRate, sellRate, setDraft } = get();
    const parsed = parseAmount(fromAmount);
    if (parsed === null) return;
    const rate = getRateByDirection(direction, buyRate, sellRate);
    setDraft({ direction, rate, amount: parsed, fromWithdraw: opts?.fromWithdraw });
  },

  swap: () => {
    const state = get();
    const newDirection = state.direction === "BUY" ? "SELL" : "BUY";
    set({ direction: newDirection, fromAmount: "" });
  },
}));


