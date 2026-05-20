import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const RANGE_START_YEAR = 2025;
const RANGE_START_MONTH = 7; // август

const now = new Date();
const RANGE_END_YEAR = now.getFullYear();
const RANGE_END_MONTH = now.getMonth();

const TOTAL_ITEMS =
  (RANGE_END_YEAR * 12 + RANGE_END_MONTH) -
  (RANGE_START_YEAR * 12 + RANGE_START_MONTH) + 1;

function indexToMonthYear(index: number): { month: number; year: number } {
  const totalMonths = RANGE_START_YEAR * 12 + RANGE_START_MONTH + index;
  return { year: Math.floor(totalMonths / 12), month: totalMonths % 12 };
}

function monthYearToIndex(month: number, year: number): number {
  return (year * 12 + month) - (RANGE_START_YEAR * 12 + RANGE_START_MONTH);
}

type MonthPickerProps = {
  isOpen: boolean;
  month: number;
  year: number;
  onSelect: (month: number, year: number) => void;
  onClose: () => void;
};

const WHEEL_THRESHOLD = 30;

export default function MonthPicker({ isOpen, month, year, onSelect, onClose }: MonthPickerProps) {
  const { t, i18n } = useTranslation();
  const monthsLower = useMemo(
    () => t("months.lower", { returnObjects: true }) as string[],
    [t, i18n.language]
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const [centeredIndex, setCenteredIndex] = useState(() =>
    Math.max(0, Math.min(TOTAL_ITEMS - 1, monthYearToIndex(month, year)))
  );
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelAccum = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 500);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (mounted && isOpen) {
      const t = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(t);
    }
  }, [mounted, isOpen]);

  useLayoutEffect(() => {
    if (!mounted || !scrollRef.current) return;
    const index = Math.max(0, Math.min(TOTAL_ITEMS - 1, monthYearToIndex(month, year)));
    setCenteredIndex(index);
    scrollRef.current.scrollTop = index * ITEM_HEIGHT;
  }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelAccum.current += e.deltaY;
      if (Math.abs(wheelAccum.current) >= WHEEL_THRESHOLD) {
        const direction = wheelAccum.current > 0 ? 1 : -1;
        wheelAccum.current = 0;
        const currentIndex = Math.round(el.scrollTop / ITEM_HEIGHT);
        const newIndex = Math.max(0, Math.min(TOTAL_ITEMS - 1, currentIndex + direction));
        el.scrollTo({ top: newIndex * ITEM_HEIGHT, behavior: "smooth" });
      }
    };
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [mounted]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const rounded = Math.max(0, Math.min(TOTAL_ITEMS - 1,
      Math.round(scrollRef.current.scrollTop / ITEM_HEIGHT)
    ));
    setCenteredIndex(rounded);

    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      if (!scrollRef.current) return;
      const snapped = Math.max(0, Math.min(TOTAL_ITEMS - 1,
        Math.round(scrollRef.current.scrollTop / ITEM_HEIGHT)
      ));
      scrollRef.current.scrollTo({ top: snapped * ITEM_HEIGHT, behavior: "smooth" });
    }, 150);
  };

  const handleConfirm = () => {
    if (!scrollRef.current) return;
    const index = Math.max(0, Math.min(TOTAL_ITEMS - 1,
      Math.round(scrollRef.current.scrollTop / ITEM_HEIGHT)
    ));
    const { month: m, year: y } = indexToMonthYear(index);
    onSelect(m, y);
    onClose();
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        style={{ opacity: visible ? 1 : 0, transition: "opacity 500ms ease" }}
        onClick={onClose}
      />

      <div
        className="relative w-full rounded-t-3xl bg-[#080c19]"
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 500ms cubic-bezier(0.32, 0.72, 0, 1)",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20" />

        <div className="relative flex items-center justify-center px-5 py-4">
          <span className="text-base font-medium text-white">{t("monthPicker.title")}</span>
          <button
            onClick={handleConfirm}
            className="absolute right-5 rounded-xl bg-white/10 px-4 py-1.5 text-sm font-medium text-white active:bg-white/20"
          >
            {t("monthPicker.done")}
          </button>
        </div>

        <div
          className="relative mx-4 mb-6 overflow-hidden select-none"
          style={{ height: CONTAINER_HEIGHT }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10"
            style={{
              height: ITEM_HEIGHT * 2,
              background: "linear-gradient(to bottom, #080c19 0%, transparent 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10"
            style={{
              height: ITEM_HEIGHT * 2,
              background: "linear-gradient(to top, #080c19 0%, transparent 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 z-10 rounded-2xl bg-white/10"
            style={{ top: ITEM_HEIGHT * 2, height: ITEM_HEIGHT }}
          >
            <div className="flex h-full items-center justify-end pr-10">
              <span className="text-lg font-bold text-white">
                {indexToMonthYear(centeredIndex).year}
              </span>
            </div>
          </div>

          <style>{`[data-month-scroll]::-webkit-scrollbar { display: none; }`}</style>
          <div
            ref={scrollRef}
            data-month-scroll
            className="h-full overflow-y-scroll overscroll-contain touch-pan-y"
            style={{
              scrollSnapType: "y mandatory",
              scrollSnapStop: "always",
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
            }}
            onScroll={handleScroll}
          >
            <div style={{ height: ITEM_HEIGHT * 2 }} />
            {Array.from({ length: TOTAL_ITEMS }, (_, i) => {
              const { month: m } = indexToMonthYear(i);
              const isActive = i === centeredIndex;
              return (
                <div
                  key={i}
                  style={{ height: ITEM_HEIGHT, scrollSnapAlign: "center" }}
                  className="flex items-center justify-center"
                >
                  <span
                    className={`text-lg transition-all duration-150 ${
                      isActive ? "font-bold text-white" : "font-normal text-white/35"
                    }`}
                  >
                    {monthsLower[m]}
                  </span>
                </div>
              );
            })}
            <div style={{ height: ITEM_HEIGHT * 2 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
