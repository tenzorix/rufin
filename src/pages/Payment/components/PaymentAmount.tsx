import { useTranslation } from "react-i18next";
import { getDateLocale } from "@/i18n";

type PaymentAmountProps = {
  amount: number;
  currency: string;
  equivalent: string;
};

export default function PaymentAmount({
  amount,
  currency,
  equivalent,
}: PaymentAmountProps) {
  const { i18n } = useTranslation();
  const locale = getDateLocale();
  return (
    <div key={i18n.language} className="flex flex-col items-center text-white">
      <p className="text-5xl font-bold tracking-tight">
        {amount.toLocaleString(locale)}
        <span className="ml-1 text-3xl font-ibold text-white/60">
          {currency}
        </span>
      </p>
      <span className="mt-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-white ring-1 ring-white/15">
        {equivalent}
      </span>
    </div>
  );
}
