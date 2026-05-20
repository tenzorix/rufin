import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

type ConfirmPanelProps = {
    isSubmitting?: boolean;
    isDraftMissing?: boolean;
    isUnauthorized?: boolean;
    isInsufficientFunds?: boolean;
};

export default function ConfirmPanel({
    isSubmitting = false,
    isDraftMissing = false,
    isUnauthorized = false,
    isInsufficientFunds = false,
}: ConfirmPanelProps) {
    const { t } = useTranslation();
    const [agreed, setAgreed] = useState(false);

    return (
        <section className="space-y-4 rounded-3xl py-5">
            <div className="flex w-full items-center gap-2 px-2 text-left">
                <button
                    type="button"
                    onClick={() => setAgreed((v) => !v)}
                    aria-pressed={agreed}
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors ${
                        agreed ? "border-[#3F8CFF] bg-[#3F8CFF] text-white" : "border-white/40 bg-transparent"
                    }`}
                >
                    {agreed ? "✓" : ""}
                </button>
                <span
                    onClick={() => setAgreed(true)}
                    className={`cursor-pointer text-xs font-medium ${agreed ? "text-white" : "text-white/40"}`}
                >
                    {t("confirmPanel.readRules")}{" "}
                    <Link to="/rules" className="underline text-white hover:text-white/80">
                        {t("confirmPanel.rules")}
                    </Link>{" "}
                    {t("confirmPanel.acceptTerms")}
                </span>
            </div>

            <p className="text-xs px-2 text-white/50">
                {t("confirmPanel.rateNote")}
            </p>

            <button
                type="submit"
                disabled={!agreed || isSubmitting || isDraftMissing || isUnauthorized || isInsufficientFunds}
                className="w-full rounded-2xl bg-white py-3 text-sm font-medium text-[#080C18] transition-colors disabled:bg-white/15 disabled:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? t("confirmPanel.submitting") : t("confirmPanel.submit")}
            </button>
        </section>
    );
}

