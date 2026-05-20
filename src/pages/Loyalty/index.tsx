import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/shared/PageHeader";
import MenuGroup from "@/components/shared/MenuGroup";
import { cn } from "@/utils/cn";
import { useBackButton } from "@/hooks/useBackButton";

type LoyaltyTier = {
    name: string;
    turnover: string;
    discount: string;
    highlighted?: boolean;
};

function LoyaltyItem({ tier, isLast, discountLabel }: { tier: LoyaltyTier; isLast: boolean; discountLabel: string }) {
    return (
        <div className="relative flex items-center justify-between px-4 py-3">
            <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-white">{tier.name}</span>
                <span className="text-xs text-white">{tier.turnover}</span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
                <span className={cn("text-[18px] font-bold", tier.highlighted ? "text-emerald-400" : "text-white")}>
                    {tier.discount}
                </span>
                <span className="text-xs text-white/50">{discountLabel}</span>
            </div>
            {!isLast && (
                <div className="absolute bottom-0 left-4 right-4 h-px bg-white/10" />
            )}
        </div>
    );
}

function Loyalty() {
    const { t } = useTranslation();
    useBackButton();

    const TIERS: LoyaltyTier[] = useMemo(
        () => [
            { name: t("loyalty.beginnerName"), turnover: t("loyalty.beginnerTurnover"), discount: t("loyalty.beginnerDiscount") },
            { name: t("loyalty.bronzeName"), turnover: t("loyalty.bronzeTurnover"), discount: t("loyalty.bronzeDiscount"), highlighted: true },
            { name: t("loyalty.silverName"), turnover: t("loyalty.silverTurnover"), discount: t("loyalty.silverDiscount"), highlighted: true },
            { name: t("loyalty.goldName"), turnover: t("loyalty.goldTurnover"), discount: t("loyalty.goldDiscount"), highlighted: true },
        ],
        [t]
    );

    return (
        <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex flex-col gap-4">
            <PageHeader title={t("loyalty.title")} />
            <MenuGroup className="rounded-[16px]">
                <LoyaltyItem tier={TIERS[0]} isLast={true} discountLabel={t("loyalty.discountFromRate")} />
            </MenuGroup>
            <MenuGroup className="rounded-[16px]">
                {TIERS.slice(1).map((tier, i) => (
                    <LoyaltyItem key={tier.name} tier={tier} isLast={i === TIERS.length - 2} discountLabel={t("loyalty.discountFromRate")} />
                ))}
            </MenuGroup>
        </div>
        </div>
    );
}
export default Loyalty;
