import { useTranslation } from "react-i18next";
import { useExchangeStore } from "@/store/useExchangeStore";
import USDTIcon from "@/assets/icons/USDTIcon";
import { getDateLocale } from "@/i18n";
import { BALANCE_EXCHANGE_FEE_USDT } from "@/constants/exchange";

function formatNumber(value: number, locale: string, options?: Intl.NumberFormatOptions) {
    return new Intl.NumberFormat(locale, options).format(value);
}

export default function CheckoutSummary() {
    const { t } = useTranslation();
    const locale = getDateLocale();
    const { draft, getOutputAmount } = useExchangeStore();

    const payAmount =
        draft?.fromWithdraw && draft.direction === "SELL"
            ? draft.amount + BALANCE_EXCHANGE_FEE_USDT
            : (draft?.amount ?? 0);
    const payCurrency = draft?.direction === "BUY" ? "RUB" : "USDT";
    const outputAmount = getOutputAmount();

    return (
        <section className="flex flex-col justify-center items-center px-5 pb-6 pt-4 text-white">
            <div className="mb-4 flex items-center justify-center gap-2">
                <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium shadow-[0_6px_20px_rgba(0,0,0,0.5)] ${
                        payCurrency === "RUB" ? "bg-blue-500" : "bg-[#11C26D]"
                    }`}
                >
                    {payCurrency === "RUB" ? "₽" : <USDTIcon />}
                </div>
                <span className="text-sm font-medium text-white/80">{t("checkout.summaryYouPay")}</span>
            </div>

            <div className="mb-1 flex justify-center">
                <div className="flex items-baseline gap-1">
                    <span className="text-[40px] leading-none font-semibold tracking-tight">
                        {formatNumber(payAmount, locale, { maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-[32px] justify-center items-center font-semibold text-white/40">{payCurrency}</span>
                </div>
            </div>

            <div className=" border w-fit border-white/10 rounded-md px-1 flex justify-center items-center text-sm font-medium text-white/60">
                ≈ {formatNumber(outputAmount, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {draft?.direction === "BUY" ? "$" : "₽"}
            </div>

            <p className="mt-1 text-[10px] text-white/40">
                {t("checkout.rateDisclaimer")}
            </p>
        </section>
    );
}

