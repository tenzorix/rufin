import { useTranslation } from "react-i18next";
import ExchangeCard from "@/components/common/ExchangeCard";
import { useOrdersQuery } from "@/api/hooks";
import {
  formatOrderAmount,
  formatOrderDateLabel,
  isOrderInMonth,
  mapOrderStatus,
  type MonthFilter,
} from "@/utils/exchangeHistory";

type ExchangeHistoryProps = {
  monthFilter?: MonthFilter;
  hidden?: boolean;
};

export default function ExchangeHistory({ monthFilter, hidden = false }: ExchangeHistoryProps = {}) {
  const { t } = useTranslation();
  const { data: orders, isLoading, isError } = useOrdersQuery();
  const filteredOrders = monthFilter && orders
    ? orders
        .filter((o) => isOrderInMonth(o.created_at, monthFilter.month, monthFilter.year))
        .sort((a, b) => {
          const da = new Date(a.created_at || 0).getTime();
          const db = new Date(b.created_at || 0).getTime();
          return db - da;
        })
    : orders;
  const totalCount = filteredOrders?.length ?? 0;

  return (
    <section className="w-full text-white/60">
      <div className="mb-1 flex items-center justify-between px-2.5">
        <h2 className="text-[13px] font-bold">{t("exchangeHistory.title")}</h2>
        <span className="text-[13px] font-bold text-white/60">
          {t("exchangeHistory.total")}:{" "}
          {isLoading ? (
            <span
              className="inline-block h-3.5 w-7 align-middle rounded bg-white/15 animate-pulse"
              aria-hidden
            />
          ) : (
            <span className="font-bold text-white/60">{totalCount}</span>
          )}
        </span>
      </div>
      {/* Skeleton */}
      {isLoading && (
        <div className="space-y-3" aria-busy="true" aria-label={t("exchangeHistory.loading")}>
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="w-full rounded-2xl bg-white/4 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="h-4 w-28 max-w-[55%] rounded bg-white/10 animate-pulse" />
                  <div className="h-3 w-36 max-w-[70%] rounded bg-white/10 animate-pulse" />
                </div>
                <div className="h-8 w-18 shrink-0 rounded-md bg-white/10 animate-pulse" />
              </div>
              <div className="my-3 h-px w-full bg-white/10" />
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
                  <div className="h-6 w-24 rounded-full bg-white/10 animate-pulse" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="h-3 w-16 rounded bg-white/10 animate-pulse" />
                  <div className="h-6 w-24 rounded-full bg-white/10 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="px-2.5 text-xs text-red-400">
          {t("exchangeHistory.error")}
        </div>
      )}

      {!isLoading && !isError && (!filteredOrders || filteredOrders.length === 0) && (
        <div className="px-2.5 mt-28 text-center text-md text-white/50">
          {monthFilter && orders && orders.length > 0
            ? t("exchangeHistory.emptyMonth")
            : t("exchangeHistory.emptyAll")}
        </div>
      )}

      {!isLoading && !isError && filteredOrders && filteredOrders.length > 0 && (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <ExchangeCard
              key={order.id}
              side={order.type === "buy" ? "buy" : "sell"}
              status={mapOrderStatus(order.status)}
              orderId={order.id.toString()}
              amount={formatOrderAmount(order.amount_rub ?? null, order.amount_usd ?? null)}
              createdAt={formatOrderDateLabel(order.created_at ?? null)}
              updatedAt={formatOrderDateLabel(order.updated_at ?? null)}
              hidden={hidden}
            />
          ))}
        </div>
      )}
    </section>
  );
}
