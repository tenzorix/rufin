export const CURRENCY_UI = {
  RUB: {
    icon: "₽",
    badgeClass: "bg-[#0295f9]",
  },
  USDT: {
    icon: "$",
    badgeClass: "bg-emerald-500",
  },
} as const;

export type CurrencyCode = keyof typeof CURRENCY_UI;
