import { useTranslation } from "react-i18next";
import { useExchangeForm } from "@/hooks/useExchangeForm";

type ExchangeSubmitButtonProps = {
  children?: React.ReactNode;
  forceDisabled?: boolean;
  fromWithdraw?: boolean;
};

export default function ExchangeSubmitButton({
  children,
  forceDisabled = false,
  fromWithdraw = false,
}: ExchangeSubmitButtonProps) {
  const { t } = useTranslation();
  const { disabled, onSubmit } = useExchangeForm({ fromWithdraw });
  const label = children ?? t("exchange.createOrder");

  return (
    <button
      type="button"
      disabled={disabled || forceDisabled}
      onClick={onSubmit}
      className="w-full rounded-2xl bg-white py-3 text-center text-sm font-bold text-[#080C18] transition-colors disabled:cursor-not-allowed disabled:bg-[#434650] disabled:text-white/70 focus:outline-none [-webkit-tap-highlight-color:transparent]"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {label}
    </button>
  );
}
