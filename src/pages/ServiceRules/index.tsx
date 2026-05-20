import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBackButton } from "@/hooks/useBackButton";
import { cn } from "@/utils/cn";

function RulesCard({
  title,
  items,
  className,
}: {
  title?: string;
  items: string[];
  className?: string;
}) {
  return (
    <div className={cn("rounded-[20px] bg-[#121622] p-4", className)}>
      {title ? <h2 className="mb-3 text-[16px] font-bold text-white">{title}</h2> : null}
      <ul className="list-disc space-y-2 pl-4 text-[13px] leading-snug text-white/85">
        {items.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ServiceRules() {
  const { t } = useTranslation();
  useBackButton();

  return (
    <div className="mx-auto w-full max-w-md space-y-4 pb-8">
      <header className="space-y-3 pt-2 text-center">
        <h1 className="flex items-center justify-center gap-2 text-[18px] font-bold text-amber-400">
          <AlertTriangle className="size-5 shrink-0 text-amber-400" strokeWidth={2} aria-hidden />
          {t("serviceRules.title")}
        </h1>
        <p className="max-w-[320px] text-center mx-auto text-[13px] text-white/80">{t("serviceRules.intro")}</p>
      </header>

      <RulesCard title={t("serviceRules.buyTitle")} items={t("serviceRules.buyItems", { returnObjects: true }) as string[]} />
      <RulesCard title={t("serviceRules.sellTitle")} items={t("serviceRules.sellItems", { returnObjects: true }) as string[]} />
      <RulesCard items={t("serviceRules.generalItems", { returnObjects: true }) as string[]} />

      <p className="px-1 text-center text-xs leading-relaxed text-white/55">{t("serviceRules.footer")}</p>
    </div>
  );
}
