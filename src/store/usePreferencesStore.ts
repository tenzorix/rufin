import { create } from "zustand";

export type DisplayCurrency = "RUB" | "USD";

type PreferencesStore = {
  displayCurrency: DisplayCurrency;
  assetsHidden: boolean;
  setDisplayCurrency: (currency: DisplayCurrency) => void;
  toggleAssetsHidden: () => void;
};

export const usePreferencesStore = create<PreferencesStore>((set) => ({
  displayCurrency: "RUB",
  assetsHidden: false,
  setDisplayCurrency: (currency) => set({ displayCurrency: currency }),
  toggleAssetsHidden: () => set((s) => ({ assetsHidden: !s.assetsHidden })),
}));
