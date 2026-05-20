import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "@/store/useToastStore";
import CheckoutSummary from "./components/CheckoutSummary";
import ConfirmPanel from "./components/ConfirmPanel";
import PersonalForm from "@/components/common/PersonalForm";
import WalletInput from "./components/WalletInput";
import { useLumoBalanceQuery, useLumoExchangeOrderMutation, useLumoWalletQuery } from "@/api/lumoHooks";
import { useBackButton } from "@/hooks/useBackButton";
import { useProfileQuery, useSubmitRequestMutation, useUpdateFullnameMutation } from "@/api/hooks";
import { useExchangeStore } from "@/store/useExchangeStore";
import { BALANCE_EXCHANGE_FEE_USDT } from "@/constants/exchange";
import { useAuthStore } from "@/store/useAuthStore";
import { calculateAmountRubForRequest } from "@/utils/exchangeCalculations";
import {
    handleCheckoutSuccess,
    parseFullname,
    type CheckoutFormValues,
    validateCheckoutForm,
} from "@/utils/exchangeCheckout";
import { useCheckoutForm } from "./useCheckoutForm";

export default function ExchangeCheckout() {
    const { t } = useTranslation();
    useBackButton();
    const {
        state,
        initializeFromProfile,
        setRememberData,
        setNamePart,
        setSelectedAddress,
        applyValidationErrors,
        clearErrors,
    } = useCheckoutForm();
    const { data: profile } = useProfileQuery();
    const shouldPrefill = Boolean(profile?.remember_data);
    const defaults = useMemo(
        () =>
            parseFullname(
                shouldPrefill && profile?.name ? profile.name : undefined
            ),
        [shouldPrefill, profile?.name]
    );
    useEffect(() => {
        initializeFromProfile({ ...defaults, rememberData: shouldPrefill });
    }, [defaults, shouldPrefill, initializeFromProfile]);

    const navigate = useNavigate();
    const draft = useExchangeStore((s) => s.draft);
    const walletQuery = useLumoWalletQuery();
    const balanceQuery = useLumoBalanceQuery({ refetchInterval: 10_000 });
    const internalWalletAddress = walletQuery.data?.address ?? "";
    const balanceNum = balanceQuery.data?.available ?? 0;
    const insufficientFunds =
        draft?.direction === "SELL" &&
        Boolean(draft.fromWithdraw) &&
        internalWalletAddress.length > 0 &&
        draft.amount > 0 &&
        draft.amount + BALANCE_EXCHANGE_FEE_USDT > balanceNum;
    const clearDraft = useExchangeStore((s) => s.clearDraft);
    const telegramUserId = useAuthStore((s) => s.telegramUserId);
    const submitMutation = useSubmitRequestMutation();
    const updateFullnameMutation = useUpdateFullnameMutation();
    const exchangeOrderMutation = useLumoExchangeOrderMutation();

    const isSubmitting =
        submitMutation.isPending || updateFullnameMutation.isPending || exchangeOrderMutation.isPending;

    useEffect(() => {
        if (!draft) navigate("/");
    }, [draft, navigate]);

    const handleSubmit = useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!draft || !telegramUserId) return;

            clearErrors();

            const formValues: CheckoutFormValues = {
                firstName: state.firstName.trim(),
                lastName: state.lastName.trim(),
                middleName: state.middleName.trim() || null,
                usdtAddress: state.selectedAddress.trim() || null,
            };
            const validation = validateCheckoutForm(formValues, {
                internalWalletAddress,
                requireUsdt: draft.direction === "BUY",
            });
            if (!validation.ok) {
                applyValidationErrors({
                    nameError: validation.nameError,
                    usdtError: validation.usdtError,
                });
                return;
            }
            const {
                firstName: validatedFirstName,
                lastName: validatedLastName,
                middleName: validatedMiddleName,
                usdtAddress,
            } = validation.values;
            const amount_rub = calculateAmountRubForRequest({
                amount: draft.amount,
                direction: draft.direction,
                rate: draft.rate,
            });

            try {
                if (draft.fromWithdraw) {
                    await updateFullnameMutation.mutateAsync({
                        lastName: validatedLastName,
                        firstName: validatedFirstName,
                        middleName: validatedMiddleName || undefined,
                    });
                    const res = await exchangeOrderMutation.mutateAsync({
                        amountUsdt: draft.amount,
                    });
                    if (res.success) {
                        handleCheckoutSuccess(navigate, clearDraft, {
                            toastMessage: `Заявка принята: ${res.amountRub.toLocaleString()}₽`,
                        });
                    } else {
                        toast.error(t("validation.submitError"));
                    }
                } else {
                    await submitMutation.mutateAsync({
                        type: draft.direction === "BUY" ? "buy" : "sell",
                        amount_rub,
                        firstName: validatedFirstName,
                        lastName: validatedLastName,
                        middleName: validatedMiddleName || undefined,
                        source: "telegram",
                        telegram_user_id: telegramUserId,
                        usdt_address: draft.direction === "BUY" ? usdtAddress : null,
                        rememberData: state.rememberData,
                    });
                    handleCheckoutSuccess(navigate, clearDraft);
                }
            } catch (err) {
                console.error(err);
                toast.error(t("validation.submitError"));
            }
        },
        [
            draft,
            telegramUserId,
            submitMutation,
            updateFullnameMutation,
            exchangeOrderMutation,
            clearDraft,
            navigate,
            clearErrors,
            t,
            state.firstName,
            state.lastName,
            state.middleName,
            state.selectedAddress,
            state.rememberData,
            applyValidationErrors,
            internalWalletAddress,
        ]
    );

    return (
        <div className="min-h-full flex flex-col p-4">
            <div className="mx-auto w-full max-w-md  flex flex-col flex-1">
                <div className="space-y-4 flex-1">
                    <CheckoutSummary />
                    <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                        <PersonalForm
                            key={profile ? "ready" : "loading"}
                            errorMessage={state.nameError}
                            values={{
                                lastName: state.lastName,
                                firstName: state.firstName,
                                middleName: state.middleName,
                            }}
                            onChange={{
                                lastName: (v) => {
                                    setNamePart("lastName", v);
                                },
                                firstName: (v) => {
                                    setNamePart("firstName", v);
                                },
                                middleName: (v) => {
                                    setNamePart("middleName", v);
                                },
                            }}
                            remember={state.rememberData}
                            onRememberChange={setRememberData}
                        />
                        {draft?.direction === "BUY" ? (
                            <WalletInput
                                initialAddress={
                                    draft?.fromWithdraw
                                        ? internalWalletAddress
                                        : shouldPrefill
                                            ? (profile?.usdt_address ?? "")
                                            : ""
                                }
                                lockInternalWallet={draft?.fromWithdraw}
                                errorMessage={state.usdtError}
                                onAddressChange={(addr) => {
                                    setSelectedAddress(addr);
                                }}
                            />
                        ) : null}
                        {insufficientFunds ? (
                            <p className="text-sm text-red-400 px-2">{t("exchange.insufficientFunds")}</p>
                        ) : null}
                        <div className="mt-4">
                            <ConfirmPanel
                                isSubmitting={isSubmitting}
                                isDraftMissing={!draft}
                                isUnauthorized={!telegramUserId}
                                isInsufficientFunds={insufficientFunds}
                            />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

