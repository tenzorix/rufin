import { Check, CreditCard, LoaderCircle } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type PaymentStatusProps = {
  stage: "scanning" | "preparing" | "confirm" | "paying" | "done";
};

export default function PaymentStatus({ stage }: PaymentStatusProps) {
  const { t } = useTranslation();

  const config = useMemo(
    () =>
      ({
        scanning: {
          icon: <LoaderCircle className="size-6 animate-spin text-white/70" />,
          title: "Сканируем QR",
          subtitle: "Откройте QR-код магазина",
        },
        preparing: {
          icon: <LoaderCircle className="size-6 animate-spin text-white/70" />,
          title: "Готовим платёж",
          subtitle: "Получаем условия обмена…",
        },
        confirm: {
          icon: <CreditCard className="size-6 text-white/70" />,
          title: t("payment.statusIdleTitle"),
          subtitle: t("payment.statusIdleSubtitle"),
        },
        paying: {
          icon: <LoaderCircle className="size-6 animate-spin text-white/70" />,
          title: t("payment.statusPayingTitle"),
          subtitle: t("payment.statusPayingSubtitle"),
        },
        done: {
          icon: <Check className="size-7 text-emerald-400" strokeWidth={3} />,
          title: t("payment.statusDoneTitle"),
          subtitle: t("payment.statusDoneSubtitle"),
        },
      }) as const,
    [t]
  );

  const { icon, title, subtitle } = config[stage];

  return (
    <div className="flex flex-col items-center rounded-[24px] bg-white/6 px-6 pt-5 pb-3">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
        {icon}
      </span>
      <p className="mt-3 text-base font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-white/50">{subtitle}</p>
    </div>
  );
}
