import { create } from "zustand";
import { getTelegramInitData } from "@/telegram/initData";

type AuthStore = {
  telegramUserId: string | null;
  initTelegramAuth: () => void;
};

function parseTelegramUserId(raw: string): string | null {
  try {
    const params = new URLSearchParams(raw);
    const userStr = params.get("user");
    if (!userStr) return null;
    const user = JSON.parse(decodeURIComponent(userStr));
    return user?.id != null ? String(user.id) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  telegramUserId: null,

  initTelegramAuth: () => {
    try {
      const raw = getTelegramInitData();
      if (raw) {
        const userId = parseTelegramUserId(raw);
        if (userId) {
          set({ telegramUserId: userId });
        }
      }
    } catch (e) {
      console.warn("[AuthStore] Failed to retrieve Telegram initData:", e);
    }
  },
}));
