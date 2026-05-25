import { useRef, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { RubleIcon } from "@/components/shared/RubleIcon";
import {
  countDigitsRight,
  formatAmountForUi,
  getCaretIndexByDigitsRight,
} from "@/utils/exchangeInput";
import { cn } from "@/utils/cn";

type CashAmountCardProps = {
  label: string;
  amount: string;
  error?: string | null;
  readOnly?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
};

export default function CashAmountCard({
  label,
  amount,
  error,
  readOnly = false,
  onChange,
  onBlur,
}: CashAmountCardProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const el = e.target;
    const selectionStart = el.selectionStart ?? el.value.length;
    const digitsRight = countDigitsRight(el.value, selectionStart);

    onChange(e);

    queueMicrotask(() => {
      const input = inputRef.current;
      if (!input) return;
      const idx = getCaretIndexByDigitsRight(input.value, digitsRight);
      input.setSelectionRange(idx, idx);
    });
  };

  return (
    <section className="rounded-[24px] bg-white/[0.06] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0295F9] text-white">
            <RubleIcon className="size-6" />
          </span>
          <span className="whitespace-nowrap text-base font-bold leading-none text-white">
            {label}
          </span>
        </div>
        <span className="shrink-0 rounded-[6px] border border-white/15 px-2 py-0.5 text-sm font-medium leading-none text-white/55">
          {t("cashOrder.noCommission")}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={formatAmountForUi(amount)}
          onChange={handleChange}
          onBlur={onBlur}
          readOnly={readOnly}
          placeholder="0"
          className={cn(
            "min-w-0 flex-1 bg-transparent text-[40px] font-bold leading-none text-white outline-none placeholder:text-white",
            error && "text-red-400"
          )}
        />
        <span className="shrink-0 text-[32px] font-bold leading-none text-white/45">
          RUB
        </span>
      </div>
    </section>
  );
}
