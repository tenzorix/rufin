import { useTranslation } from "react-i18next";
import BalanceSkeleton from "@/components/shared/BalanceSkeleton";

type ExchangeSide = "buy" | "sell";

type ExchangeStatus = "completed" | "pending" | "cancelled";

const STATUS_CLASSES: Record<ExchangeStatus, string> = {
  completed: "bg-[#27C182]/52 text-white",
  pending: "bg-amber-500/15 text-white",
  cancelled: "bg-red-500/15 text-white",
};

export type ExchangeCardProps = {
  side: ExchangeSide;
  status: ExchangeStatus;
  orderId: string;
  amount: string;
  createdAt: string;
  updatedAt: string;
  hidden?: boolean;
};

export default function ExchangeCard({
  side,
  status,
  orderId,
  amount,
  createdAt,
  updatedAt,
  hidden = false,
}: ExchangeCardProps) {
  const { t } = useTranslation();
  const isBuy = side === "buy";
  const statusLabel =
    status === "completed"
      ? t("exchangeCard.statusCompleted")
      : status === "pending"
        ? t("exchangeCard.statusPending")
        : t("exchangeCard.statusCancelled");
  const timeRows = [
    { label: t("exchangeCard.createdAt"), value: createdAt },
    { label: t("exchangeCard.updatedAt"), value: updatedAt },
  ];

  return (
    <div className="w-full rounded-2xl bg-white/4 px-4 py-3 font-profile-rounded text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 ">
          <div className="flex items-center gap-2">
            <div className="truncate text-sm font-semibold">
              {isBuy ? t("exchangeCard.buy") : t("exchangeCard.sell")}
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide ${STATUS_CLASSES[status]}`}
            >
              {statusLabel}
            </span>
          </div>

          <div className="text-sm text-white/60">{t("exchangeCard.order", { id: orderId })}</div>
        </div>

        <div className="flex min-h-[1.3em] min-w-[4.5em] shrink-0 items-center justify-end text-right text-2xl">
          {hidden ? (
            <BalanceSkeleton size="medium" />
          ) : (
            <div className="font-bold leading-none">{amount}</div>
          )}
        </div>
      </div>
      <div className="my-3 h-px w-full bg-white/10" />

      <div className="mt-3 space-y-1 text-[12px] text-white/60">
        {timeRows.map((row) => (
          <div key={row.label} className="flex justify-between items-center gap-2">
            <div>{row.label}</div>
            <div className="inline-flex items-center rounded-sm bg-[#FFFFFF17] px-1 text-[12px] text-white/80">
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </div>  
  );
}
