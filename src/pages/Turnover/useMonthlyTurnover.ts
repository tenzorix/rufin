import { useMemo } from "react";
import type { Order } from "@/api/schemas";

const COMPLETED_STATUSES = ["completed", "done"];

function isCompleted(status: string | undefined | null): boolean {
  if (!status) return false;
  return COMPLETED_STATUSES.includes(status.toLowerCase());
}

function isInMonth(dateStr: string | undefined | null, month: number, year: number): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d.getMonth() === month && d.getFullYear() === year;
}

export type MonthlyStats = {
  turnoverUsd: number;
  turnoverRub: number;
  purchasesUsd: number;
  purchasesRub: number;
  salesUsd: number;
  salesRub: number;
  ordersCount: number;
};

export function useMonthlyTurnover(
  orders: Order[] | undefined,
  month: number,
  year: number
): MonthlyStats {
  return useMemo(() => {
    const empty: MonthlyStats = {
      turnoverUsd: 0,
      turnoverRub: 0,
      purchasesUsd: 0,
      purchasesRub: 0,
      salesUsd: 0,
      salesRub: 0,
      ordersCount: 0,
    };

    if (!orders || orders.length === 0) return empty;

    const monthOrders = orders.filter(
      (o) => isCompleted(o.status) && isInMonth(o.created_at, month, year)
    );

    let purchasesUsd = 0;
    let purchasesRub = 0;
    let salesUsd = 0;
    let salesRub = 0;

    for (const o of monthOrders) {
      const usd = Number(o.amount_usd) || 0;
      const rub = Number(o.amount_rub) || 0;

      if (o.type?.toLowerCase() === "buy") {
        purchasesUsd += usd;
        purchasesRub += rub;
      } else {
        salesUsd += usd;
        salesRub += rub;
      }
    }

    return {
      turnoverUsd: purchasesUsd + salesUsd,
      turnoverRub: purchasesRub + salesRub,
      purchasesUsd,
      purchasesRub,
      salesUsd,
      salesRub,
      ordersCount: monthOrders.length,
    };
  }, [orders, month, year]);
}
