import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import PageHeader from "@/components/shared/PageHeader";
import RubCurrencyIcon from "@/assets/icons/RubCurrencyIcon";
import UsdtCurrencyIcon from "@/assets/icons/UsdtCurrencyIcon";
import { useBackButton } from "@/hooks/useBackButton";

type WithdrawOptionProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
};

function WithdrawOption({ icon, title, description, onClick }: WithdrawOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer flex-col items-start gap-2 self-stretch rounded-[24px] bg-white/[0.06] p-2 text-left transition-colors active:bg-white/[0.1] [-webkit-tap-highlight-color:transparent]"
    >
      <div className="flex w-full items-center justify-between self-stretch pr-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 shrink-0">{icon}</div>
          <div className="flex flex-col items-start py-1">
            <div className="text-[14px] font-bold leading-normal text-white">{title}</div>
            <div className="text-[12px] leading-[100%] [font-weight:510] text-white/60">
              {description}
            </div>
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-white" />
      </div>
    </button>
  );
}

export default function WithdrawSelect() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useBackButton();

  return (
    <div className="mx-auto w-full max-w-md pt-4">
      <PageHeader title={t("withdrawSelect.title")} compact />

      <div className="mt-10 flex flex-col items-start gap-2">
        <WithdrawOption
          icon={<UsdtCurrencyIcon />}
          title="USDT"
          description={t("withdrawSelect.usdtDescription")}
          onClick={() => navigate("/withdraw")}
        />
        <WithdrawOption
          icon={<RubCurrencyIcon />}
          title="RUB"
          description={t("withdrawSelect.rubDescription")}
          onClick={() => navigate("/office-select")}
        />
      </div>
    </div>
  );
}
