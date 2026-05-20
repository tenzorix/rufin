import { useTranslation } from "react-i18next";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import BalanceSkeleton from "@/components/shared/BalanceSkeleton";

type TurnoverStatsProps = {
  purchases?: string;
  sales?: string;
};

export default function TurnoverStats({
  purchases = "—",
  sales = "—",
}: TurnoverStatsProps) {
  const { t } = useTranslation();
  const { assetsHidden } = usePreferencesStore();

  return (
    <div className="mt-5 flex min-h-18 overflow-hidden border-t border-white/10">
      <div className="flex flex-1 flex-col items-center justify-center gap-1 py-2">
        <p className="text-[13px] font-bold text-emerald-400">{t("turnoverStats.purchases")}</p>
        <div className="flex h-5 min-w-[3em] items-center justify-center text-xl sm:text-2xl">
          {assetsHidden ? (
            <BalanceSkeleton size="small" />
          ) : (
            <p className="font-medium text-[16px] text-white">{purchases}</p>
          )}
        </div>
      </div>
      <div className="my-2 w-px shrink-0 bg-white/10" />
      <div className="flex flex-1 flex-col items-center justify-center gap-1 py-2">
        <p className="text-[13px] font-bold text-red-400">{t("turnoverStats.sales")}</p>
        <div className="flex h-5 min-w-[3em] items-center justify-center text-xl sm:text-2xl">
          {assetsHidden ? (
            <BalanceSkeleton size="small" />
          ) : (
            <p className="font-medium text-[16px] text-white">{sales}</p>
          )}
        </div>
      </div>
    </div>
  );
}
