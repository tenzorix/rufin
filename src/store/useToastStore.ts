import { create } from "zustand";

export type ToastVariant = "success" | "error";

type ToastState = {
  message: string | null;
  variant: ToastVariant;
  show: (message: string, variant?: ToastVariant, durationMs?: number) => void;
  dismiss: () => void;
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;

const DEFAULT_DURATION_MS = 2500;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  variant: "success",
  show: (message, variant = "success", durationMs = DEFAULT_DURATION_MS) => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message, variant });
    hideTimer = setTimeout(() => {
      set({ message: null });
      hideTimer = null;
    }, durationMs);
  },
  dismiss: () => {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = null;
    set({ message: null });
  },
}));

export const toast = {
  success: (message: string, durationMs?: number) =>
    useToastStore.getState().show(message, "success", durationMs),
  error: (message: string, durationMs?: number) =>
    useToastStore.getState().show(message, "error", durationMs),
};
