import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import PageHeader from "@/components/shared/PageHeader";
import { useBackButton } from "@/hooks/useBackButton";

type OfficeFlow = "deposit" | "withdraw";

function OfficeOption({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer flex-col items-start gap-2 self-stretch rounded-[24px] bg-white/[0.06] p-4 text-left transition-colors active:bg-white/[0.1] [-webkit-tap-highlight-color:transparent]"
    >
      <div className="flex w-full items-center justify-between self-stretch gap-1">
        <div className="flex min-w-0 flex-col gap-1 items-start">
          <div className="text-[14px] font-bold leading-normal text-white">
            {t("officeSelect.city")}
          </div>
          <div className="text-[12px] leading-[100%] [font-weight:510] text-white/60">
            {t("officeSelect.address")}
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-white" />
      </div>
    </button>
  );
}

export default function OfficeSelect() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  useBackButton();

  const flow: OfficeFlow = searchParams.get("flow") === "withdraw" ? "withdraw" : "deposit";
  const nextPath = flow === "withdraw" ? "/cash-withdraw" : "/cash-deposit";

  return (
    <div className="mx-auto w-full max-w-md pt-4">
      <PageHeader title={t("officeSelect.title")} compact />

      <div className="mt-10 flex flex-col items-start gap-2">
        <OfficeOption onClick={() => navigate(nextPath)} />
      </div>
    </div>
  );
}
