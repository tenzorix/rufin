import { create } from "zustand";

type BottomNavState = {
  hiddenLocks: number;
  lock: () => void;
  unlock: () => void;
};

export const useBottomNavStore = create<BottomNavState>((set) => ({
  hiddenLocks: 0,
  lock: () =>
    set((state) => ({
      hiddenLocks: state.hiddenLocks + 1,
    })),
  unlock: () =>
    set((state) => ({
      hiddenLocks: Math.max(0, state.hiddenLocks - 1),
    })),
}));
