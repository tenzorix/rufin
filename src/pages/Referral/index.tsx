import { useEffect } from "react";
import { Trans, useTranslation } from "react-i18next";
import MetricDisplay from "@/components/common/MetricDisplay";
import RefCodeBlock from "@/components/common/RefCodeBlock";
import MenuItem from "../../components/shared/MenuItem";
import MenuGroup from "../../components/shared/MenuGroup";
import PageHeader from "@/components/shared/PageHeader";
import Button from "@/components/shared/Button";
import { useBackButton } from "@/hooks/useBackButton";
import { preloadDepositQR } from "@/components/common/qrCodeCache";
import { shareRefLink } from "@/utils/shareRefLink";
import { useProfileQuery } from "@/api/hooks";
import { telegramBotDeepLink } from "@/constants/env";
import { usePreferencesStore } from "@/store/usePreferencesStore";


const ReferalIcon = () => (
    <svg width="20" height="13" viewBox="0 0 20 13" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M13.3027 6.54883C11.6074 6.54883 10.2471 5.0791 10.2471 3.24707C10.2471 1.46289 11.6211 0 13.3027 0C14.9912 0 16.3652 1.44922 16.3652 3.24023C16.3652 5.07227 14.998 6.54883 13.3027 6.54883ZM5.30469 6.65137C3.82129 6.65137 2.625 5.35938 2.625 3.74609C2.625 2.1875 3.83496 0.888672 5.30469 0.888672C6.77441 0.888672 7.97754 2.16699 7.97754 3.73926C7.97754 5.35254 6.78125 6.65137 5.30469 6.65137ZM13.3027 5.10645C14.1641 5.10645 14.875 4.29297 14.875 3.24023C14.875 2.22852 14.1641 1.44922 13.3027 1.44922C12.4551 1.44922 11.7305 2.24219 11.7305 3.24707C11.7305 4.2998 12.4482 5.10645 13.3027 5.10645ZM5.30469 5.22949C5.98828 5.22949 6.55566 4.58008 6.55566 3.73926C6.55566 2.94629 5.98145 2.31055 5.30469 2.31055C4.62793 2.31055 4.05371 2.95312 4.05371 3.74609C4.05371 4.58008 4.62793 5.22949 5.30469 5.22949ZM1.60645 12.9609C0.533203 12.9609 0 12.4756 0 11.5732C0 9.30371 2.37207 7.25977 5.29785 7.25977C6.26172 7.25977 7.37598 7.5332 8.2168 7.99121C7.73828 8.29199 7.39648 8.6543 7.15039 9.07812C6.66504 8.83887 5.91309 8.6748 5.29785 8.6748C3.2334 8.6748 1.54492 10.0352 1.54492 11.3955C1.54492 11.4844 1.58594 11.5391 1.70215 11.5391H6.17969C6.125 12.0586 6.37793 12.6875 6.82227 12.9609H1.60645ZM9.09863 12.9609C7.84766 12.9609 7.22559 12.5371 7.22559 11.6416C7.22559 9.63867 9.7002 7.25977 13.3027 7.25977C16.8984 7.25977 19.3799 9.63867 19.3799 11.6416C19.3799 12.5371 18.7578 12.9609 17.5068 12.9609H9.09863ZM9.04395 11.5117H17.5547C17.6914 11.5117 17.7324 11.457 17.7324 11.3613C17.7324 10.4453 16.1191 8.70898 13.3027 8.70898C10.4863 8.70898 8.87305 10.4453 8.87305 11.3613C8.87305 11.457 8.91406 11.5117 9.04395 11.5117Z" fill="white"/>
</svg>
)

export default function ReferralProgram() {
    const { t } = useTranslation();
    const { data: profile, isLoading } = useProfileQuery();
    const assetsHidden = usePreferencesStore((s) => s.assetsHidden);

    const referralBalance = profile?.calculated_balance != null
        ? `$ ${Math.floor(profile.calculated_balance)}`
        : "$ 0";
    const referralCode = profile?.referal_code ?? "";
    const referralsCount = profile?.total_referrals ?? 0;
    const activeRefsCount = profile?.active_refs ?? 0;

    useBackButton();

    useEffect(() => {
        if (!referralCode) return;
        preloadDepositQR(telegramBotDeepLink(`ref_${referralCode}`), "/icons/rufin.png", 240);
    }, [referralCode]);

    return (
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col pt-4">
            {/* Заголовок */}
            <PageHeader title={t("referral.pageTitle")} />
            <div className="flex flex-1 flex-col justify-center">
                {/* Баланс и реферальный код */}
                <section className="text-center">
                    <MetricDisplay
                        label={t("referral.refBalance")}
                        amount={referralBalance.toString()}
                        hidden={assetsHidden}
                        className="h-1 text-[48px] text-bold"
                    />
                    <RefCodeBlock refCode={referralCode || (isLoading ? "…" : "—")} showShareButton={false} className="" />
                </section>
            </div>

            <div className="mt-4 ">
                {/* Карточка с количеством рефералов */}
                <MenuGroup className="mb-4 rounded-[20px] bg-[#121622]">
                    <MenuItem icon={ReferalIcon} label={t("referral.referrals")} value={referralsCount.toString()} clickable={false} inGroup={true} className="border-0 px-2" valueClassName="text-[20px] font-bold" />
                    <MenuItem icon={ReferalIcon} label={t("referral.activeReferrals")} value={activeRefsCount.toString()} clickable={false} inGroup={true} isLastInGroup={true} className="border-0 px-2" valueClassName="text-[20px] font-bold" />
                </MenuGroup>
                {/* Карточка с условиями программы */}
                <section className="space-y-3 mb-4  rounded-[20px] bg-[#121622] p-4">
                    <h2 className="whitespace-pre-line text-base font-semibold">
                        {t("referral.headline")}
                    </h2>

                    <ul className="space-y-2 text-sm text-white/70">
                        <li className="flex gap-2">
                            <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/50" />
                            <span>
                                <Trans i18nKey="referral.reward1" components={{ bold: <span className="font-semibold" /> }} />
                            </span>
                        </li>
                        <li className="flex gap-2">
                            <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-white/50" />
                            <span>
                                <Trans i18nKey="referral.reward2" components={{ bold: <span className="font-semibold" /> }} />
                            </span>
                        </li>
                    </ul>
                </section>
                {/* Кнопка поделиться */}
                <Button onClick={() => { if (referralCode) shareRefLink(referralCode); }} disabled={!referralCode}>
                    {t("referral.share")}
                </Button>
            </div>
        </div>
    );
}