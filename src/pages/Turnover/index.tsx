import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { getDateLocale } from "@/i18n";
import MetricDisplay from "@/components/common/MetricDisplay";
import ExchangeHistory from "@/components/common/ExchangeHistory";
import TurnoverStats from "./components/TurnoverStats";
import MonthPicker from "./components/MonthPicker";
import CurrencyTabs from "@/components/shared/CurrencyTabs";
import { useBackButton } from "@/hooks/useBackButton";
import { useOrdersQuery } from "@/api/hooks";
import { useMonthlyTurnover } from "./useMonthlyTurnover";
import { usePreferencesStore } from "@/store/usePreferencesStore";

const MIN_MONTH = 7; // август
const MIN_YEAR = 2025;

function stepMonth(month: number, year: number, delta: 1 | -1) {
  let m = month + delta;
  let y = year;
  if (m > 11) { m = 0; y += 1; }
  if (m < 0) { m = 11; y -= 1; }
  return { month: m, year: y };
}

function isMinMonth(month: number, year: number): boolean {
  return year === MIN_YEAR && month === MIN_MONTH;
}

function isMaxMonth(month: number, year: number): boolean {
  const now = new Date();
  return year === now.getFullYear() && month === now.getMonth();
}

function formatAmount(value: number, currency: "RUB" | "USD", locale: string): string {
  const nf = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return currency === "RUB" ? `${nf.format(value)}₽` : `$${nf.format(value)}`;
}

export default function Turnover() {
  const { t, i18n } = useTranslation();
  const now = new Date();
  const [selected, setSelected] = useState({ month: now.getMonth(), year: now.getFullYear() });
  const [pickerOpen, setPickerOpen] = useState(false);
  const { displayCurrency, assetsHidden } = usePreferencesStore();

  const monthsCapital = useMemo(
    () => t("months.capital", { returnObjects: true }) as string[],
    [t, i18n.language]
  );
  const locale = getDateLocale();

  const { data: orders, isLoading } = useOrdersQuery();
  const stats = useMonthlyTurnover(orders, selected.month, selected.year);

  useBackButton();

  const canGoPrev = !isMinMonth(selected.month, selected.year);
  const canGoNext = !isMaxMonth(selected.month, selected.year);

  const handleStep = (delta: 1 | -1) => {
    if (delta < 0 && !canGoPrev) return;
    if (delta > 0 && !canGoNext) return;
    setSelected((prev) => stepMonth(prev.month, prev.year, delta));
  };

  const turnoverAmount =
    displayCurrency === "RUB"
      ? formatAmount(stats.turnoverRub, "RUB", locale)
      : formatAmount(stats.turnoverUsd, "USD", locale);

  const subLabel =
    displayCurrency === "RUB"
      ? stats.turnoverUsd > 0
        ? `≈ $${stats.turnoverUsd.toLocaleString(locale, { maximumFractionDigits: 2 })}`
        : undefined
      : stats.turnoverRub > 0
        ? `≈ ${formatAmount(stats.turnoverRub, "RUB", locale)}`
        : undefined;

  const purchases =
    displayCurrency === "RUB"
      ? formatAmount(stats.purchasesRub, "RUB", locale)
      : formatAmount(stats.purchasesUsd, "USD", locale);

  const sales =
    displayCurrency === "RUB"
      ? formatAmount(stats.salesRub, "RUB", locale)
      : formatAmount(stats.salesUsd, "USD", locale);

  return (
    <div className="p-4">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white active:bg-white/20"
          >
            {monthsCapital[selected.month]} {selected.year}
            <ChevronDown size={14} className="text-white/60" />
          </button>
          <CurrencyTabs />
        </div>

        <div className="flex items-center">
          <button
            onClick={() => handleStep(-1)}
            disabled={!canGoPrev}
            className="shrink-0 rounded-full  text-white active:text-white disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="min-w-0 flex-1">
            <MetricDisplay
              label={t("turnover.label")}
              amount={isLoading ? "—" : turnoverAmount}
              subLabel={subLabel}
              sublabelClassName="text-[12px] font-bold text-white/60"
              hidden={assetsHidden}
            />
            <TurnoverStats purchases={purchases} sales={sales} />
          </div>

          <button
            onClick={() => handleStep(1)}
            disabled={!canGoNext}
            className="shrink-0 rounded-full text-white active:text-white disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <ExchangeHistory monthFilter={{ month: selected.month, year: selected.year }} hidden={assetsHidden} />
      </div>

      <MonthPicker
        isOpen={pickerOpen}
        month={selected.month}
        year={selected.year}
        onSelect={(m, y) => setSelected({ month: m, year: y })}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
