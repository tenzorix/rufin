import { useTranslation } from "react-i18next";
import { useBackButton } from "@/hooks/useBackButton";
import { cn } from "@/utils/cn";

function AboutCard({
  title,
  items,
  className,
}: {
  title: string;
  items: string[];
  className?: string;
}) {
  return (
    <div className={cn("rounded-[20px] bg-[#121622] p-4", className)}>
      <h2 className="mb-3 text-[16px] font-bold text-white">{title}</h2>
      <ul className="list-disc space-y-2 pl-4 text-[13px] leading-snug text-white/85">
        {items.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
    </div>
  );
}

export default function About() {
  const { t } = useTranslation();
  useBackButton();

  return (
    <div className="mx-auto w-full max-w-md space-y-4 pb-8">
      <header className="pt-2 text-center">
        <h1 className="text-[18px] font-bold leading-snug text-white">{t("aboutPage.hero")}</h1>
      </header>

      <AboutCard title={t("aboutPage.aboutTitle")} items={t("aboutPage.aboutItems", { returnObjects: true }) as string[]} />
      <AboutCard title={t("aboutPage.officeTitle")} items={t("aboutPage.officeItems", { returnObjects: true }) as string[]} />
    </div>
  );
}
