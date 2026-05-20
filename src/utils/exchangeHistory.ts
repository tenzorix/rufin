import { getDateLocale } from "@/i18n";

export type MonthFilter = { month: number; year: number };

export function isOrderInMonth(
  dateStr: string | undefined | null,
  month: number,
  year: number
): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d.getMonth() === month && d.getFullYear() === year;
}

export function mapOrderStatus(status: string | undefined | null) {
  if (!status) return "pending" as const;

  const normalized = status.toLowerCase();
  if (normalized === "completed" || normalized === "done") return "completed" as const;
  if (normalized === "cancelled" || normalized === "canceled") return "cancelled" as const;
  return "pending" as const;
}

export function formatOrderAmount(amountRub?: number | null, amountUsd?: number | null) {
  const nf = new Intl.NumberFormat(getDateLocale());
  if (amountRub && amountRub > 0) {
    return `${nf.format(amountRub)}₽`;
  }

  if (amountUsd && amountUsd > 0) {
    return `${nf.format(amountUsd)} USDT`;
  }

  return "—";
}

export function formatOrderDateLabel(date: string | null | undefined) {
  if (!date) return "—";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;

  return d.toLocaleString(getDateLocale(), {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}
