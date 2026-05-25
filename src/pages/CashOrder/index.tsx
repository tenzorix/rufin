import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/shared/PageHeader";
import BalanceSkeleton from "@/components/shared/BalanceSkeleton";
import { RubleIcon } from "@/components/shared/RubleIcon";
import CashAmountCard from "@/components/common/CashAmountCard";
import { useBackButton } from "@/hooks/useBackButton";
import { useCheckoutForm } from "@/pages/ExchangeCheckout/useCheckoutForm";
import { useProfileQuery, useSubmitRequestMutation, useUpdateFullnameMutation } from "@/api/hooks";
import {
  useLumoBalanceQuery,
  useLumoExchangeOrderMutation,
  useLumoRatesCurrentQuery,
  useLumoWalletQuery,
} from "@/api/lumoHooks";
import { useAuthStore } from "@/store/useAuthStore";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import { toast } from "@/store/useToastStore";
import { getDateLocale } from "@/i18n";
import { BALANCE_EXCHANGE_FEE_USDT, MAX_RUB_AMOUNT, MIN_RUB_AMOUNT } from "@/constants/exchange";
import { formatRubAmount, parseAmount } from "@/utils/exchangeCalculations";
import { handleCheckoutSuccess, parseFullname, validateCheckoutForm } from "@/utils/exchangeCheckout";
import {
  sanitizeExchangeInput,
} from "@/utils/exchangeInput";
import { cn } from "@/utils/cn";

type CashOrderMode = "deposit" | "withdraw";

type CashOrderProps = {
  mode: CashOrderMode;
};

type NameInputProps = {
  id: string;
  name: string;
  placeholder: string;
  value: string;
  withDivider?: boolean;
  onChange: (value: string) => void;
};

function formatRubParts(value: number) {
  const formatted = new Intl.NumberFormat(getDateLocale(), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace(/\u00a0/g, " ")
    .replace(",", ".");
  const [whole, fraction = "00"] = formatted.split(".");
  return { whole, fraction };
}

function OfficeSummaryCard() {
  const { t } = useTranslation();

  return (
    <section className="rounded-[24px] bg-white/[0.06] p-4">
      <div className="text-base font-bold leading-none text-white">
        {t("officeSelect.city")}
      </div>
      <div className="mt-2 text-xs font-medium leading-[1.15] text-white/55">
        {t("officeSelect.address")}
      </div>
    </section>
  );
}

function NameInput({
  id,
  name,
  placeholder,
  value,
  withDivider = false,
  onChange,
}: NameInputProps) {
  return (
    <input
      id={id}
      name={name}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full bg-transparent pb-[10px] text-sm font-medium text-white outline-none placeholder:text-white/35",
        withDivider && "border-b border-white/10 focus:border-white/45"
      )}
    />
  );
}

function CashPersonalForm({
  firstName,
  lastName,
  middleName,
  remember,
  errorMessage,
  onFirstNameChange,
  onLastNameChange,
  onMiddleNameChange,
  onRememberChange,
}: {
  firstName: string;
  lastName: string;
  middleName: string;
  remember: boolean;
  errorMessage?: string | null;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onMiddleNameChange: (value: string) => void;
  onRememberChange: (value: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2 mb-6">
      <section className="rounded-[24px] bg-white/[0.06] px-5 pb-2 pt-4">
        <div className="space-y-3">
          <NameInput
            id="cash-first-name"
            name="firstName"
            placeholder={t("cashOrder.firstName")}
            value={firstName}
            withDivider
            onChange={onFirstNameChange}
          />
          <NameInput
            id="cash-last-name"
            name="lastName"
            placeholder={t("cashOrder.lastName")}
            value={lastName}
            withDivider
            onChange={onLastNameChange}
          />
          <NameInput
            id="cash-middle-name"
            name="middleName"
            placeholder={t("personalForm.middleName")}
            value={middleName}
            onChange={onMiddleNameChange}
          />
        </div>
      </section>

      <div className="px-4">
        {errorMessage ? (
          <p className="mb-2 text-sm text-red-400">{errorMessage}</p>
        ) : null}
        <button
          type="button"
          onClick={() => onRememberChange(!remember)}
          className="flex items-center gap-2 text-sm font-medium text-white/40 [-webkit-tap-highlight-color:transparent]"
        >
          <span
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full border text-[10px] transition-colors",
              remember ? "border-[#3F8CFF] bg-[#3F8CFF] text-white" : "border-white/40 bg-transparent"
            )}
          >
            {remember ? "✓" : ""}
          </span>
          <span>{t("personalForm.remember")}</span>
        </button>
      </div>
    </div>
  );
}

function CashBalanceCard({
  balanceRub,
  loading,
}: {
  balanceRub: number;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const assetsHidden = usePreferencesStore((s) => s.assetsHidden);
  const { whole, fraction } = formatRubParts(balanceRub);

  return (
    <section className="flex h-[60px] items-center gap-2 rounded-[24px] bg-white/[0.06] p-2">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-white/[0.08]">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#30333E]">
          <RubleIcon className="size-6" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline text-[18px] font-bold leading-none text-white">
          {assetsHidden || loading ? (
            <BalanceSkeleton size="small" />
          ) : (
            <>
              <span>₽ {whole}</span>
              <span className="text-white/40">.{fraction}</span>
            </>
          )}
        </div>
        <div className="text-[13px] mt-1 font-bold leading-none text-white/65">
          {t("cashOrder.balanceRub")}
        </div>
      </div>
    </section>
  );
}

function CashConfirmPanel({
  disabled,
  isSubmitting,
}: {
  disabled: boolean;
  isSubmitting: boolean;
}) {
  const { t } = useTranslation();
  const [agreed, setAgreed] = useState(false);
  const buttonDisabled = !agreed || disabled || isSubmitting;

  return (
    <section className="space-y-5 py-5">
      <div className="flex w-full gap-[6px] items-center gap-[6px] px-2 text-left">
        <button
          type="button"
          onClick={() => setAgreed((v) => !v)}
          aria-pressed={agreed}
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors [-webkit-tap-highlight-color:transparent]",
            agreed ? "border-[#3F8CFF] bg-[#3F8CFF] text-white" : "border-white/40 bg-transparent"
          )}
        >
          {agreed ? "✓" : ""}
        </button>
        <span
          onClick={() => setAgreed(true)}
          className={cn(
            "cursor-pointer text-xs font-medium leading-tight",
            agreed ? "text-white" : "text-white/40"
          )}
        >
          {t("confirmPanel.readRules")}{" "}
          <Link to="/rules" className="text-white underline hover:text-white/80">
            {t("confirmPanel.rules")}
          </Link>{" "}
          {t("confirmPanel.acceptTerms")}
        </span>
      </div>

      <p className="px-2 text-xs font-medium leading-tight text-white/45">
        {t("confirmPanel.rateNote")}
      </p>

      <button
        type="submit"
        disabled={buttonDisabled}
        className="h-11 w-full rounded-2xl bg-white text-center text-base font-bold text-[#080C18] transition-colors disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-white/70"
      >
        {isSubmitting ? t("confirmPanel.submitting") : t("confirmPanel.submit")}
      </button>
    </section>
  );
}

export default function CashOrder({ mode }: CashOrderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useBackButton();

  const [amount, setAmount] = useState("");
  const {
    state,
    initializeFromProfile,
    setRememberData,
    setNamePart,
    applyValidationErrors,
    clearErrors,
  } = useCheckoutForm();

  const { data: profile } = useProfileQuery();
  const shouldPrefill = Boolean(profile?.remember_data);
  const defaults = useMemo(
    () => parseFullname(shouldPrefill && profile?.name ? profile.name : undefined),
    [profile?.name, shouldPrefill]
  );

  useEffect(() => {
    initializeFromProfile({ ...defaults, rememberData: shouldPrefill });
  }, [defaults, initializeFromProfile, shouldPrefill]);

  const telegramUserId = useAuthStore((s) => s.telegramUserId);
  const walletQuery = useLumoWalletQuery();
  const balanceQuery = useLumoBalanceQuery({ refetchInterval: 10_000 });
  const rateQuery = useLumoRatesCurrentQuery();
  const submitMutation = useSubmitRequestMutation();
  const updateFullnameMutation = useUpdateFullnameMutation();
  const exchangeOrderMutation = useLumoExchangeOrderMutation();

  const rateRubPerUsdt = rateQuery.data?.rate ?? null;
  const balanceUsdt = balanceQuery.data?.balance ?? 0;
  const availableUsdt = balanceQuery.data?.available ?? 0;
  const balanceRub = rateRubPerUsdt != null ? balanceUsdt * rateRubPerUsdt : 0;

  const parsedAmount = useMemo(() => parseAmount(amount), [amount]);
  const limitAmount = useMemo(
    () => MIN_RUB_AMOUNT.toLocaleString(getDateLocale()).replace(/\u00a0/g, " "),
    []
  );
  const maxAmount = useMemo(
    () => MAX_RUB_AMOUNT.toLocaleString(getDateLocale()).replace(/\u00a0/g, " "),
    []
  );

  const amountError = useMemo(() => {
    if (parsedAmount === null || parsedAmount === 0) return null;
    if (parsedAmount < MIN_RUB_AMOUNT) {
      return t("cashOrder.minRub", { amount: limitAmount });
    }
    if (parsedAmount > MAX_RUB_AMOUNT) {
      return t("cashOrder.maxRub", { amount: maxAmount });
    }
    return null;
  }, [limitAmount, maxAmount, parsedAmount, t]);

  const requestedWithdrawUsdt =
    mode === "withdraw" && parsedAmount != null && parsedAmount > 0 && rateRubPerUsdt
      ? parsedAmount / rateRubPerUsdt
      : null;
  const insufficientFunds =
    requestedWithdrawUsdt != null &&
    requestedWithdrawUsdt + BALANCE_EXCHANGE_FEE_USDT > availableUsdt + 1e-9;

  const isSubmitting =
    submitMutation.isPending || updateFullnameMutation.isPending || exchangeOrderMutation.isPending;
  const hasValidAmount = parsedAmount !== null && parsedAmount > 0 && !amountError;
  const submitDisabled =
    !hasValidAmount ||
    !telegramUserId ||
    insufficientFunds ||
    (mode === "withdraw" && !rateRubPerUsdt);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextRaw = sanitizeExchangeInput(e.target.value).split(".")[0] ?? "";
    setAmount(nextRaw);
  };

  const handleAmountBlur = () => {
    if (parsedAmount === null || parsedAmount <= 0) return;
    setAmount(formatRubAmount(parsedAmount));
  };

  const resetCashForm = useCallback(() => {
    setAmount("");
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!telegramUserId) return;
      if (!hasValidAmount || parsedAmount === null) return;

      clearErrors();

      const validation = validateCheckoutForm(
        {
          firstName: state.firstName.trim(),
          lastName: state.lastName.trim(),
          middleName: state.middleName.trim() || null,
          usdtAddress: null,
        },
        { requireUsdt: false }
      );

      if (!validation.ok) {
        applyValidationErrors({ nameError: validation.nameError });
        return;
      }

      const {
        firstName: validatedFirstName,
        lastName: validatedLastName,
        middleName: validatedMiddleName,
      } = validation.values;

      try {
        if (mode === "deposit") {
          const internalWalletAddress = walletQuery.data?.address;
          if (!internalWalletAddress) {
            toast.error(t("cashOrder.walletUnavailable"));
            return;
          }

          await submitMutation.mutateAsync({
            type: "buy",
            amount_rub: Math.round(parsedAmount),
            firstName: validatedFirstName,
            lastName: validatedLastName,
            middleName: validatedMiddleName || undefined,
            source: "telegram",
            telegram_user_id: telegramUserId,
            usdt_address: internalWalletAddress,
            rememberData: state.rememberData,
          });
          handleCheckoutSuccess(navigate, resetCashForm, {
            toastMessage: t("cashOrder.depositCreated"),
          });
          return;
        }

        if (!rateRubPerUsdt) {
          toast.error(t("cashOrder.rateUnavailable"));
          return;
        }

        if (insufficientFunds) {
          toast.error(t("exchange.insufficientFunds"));
          return;
        }

        await updateFullnameMutation.mutateAsync({
          lastName: validatedLastName,
          firstName: validatedFirstName,
          middleName: validatedMiddleName || undefined,
        });

        const amountUsdt = parsedAmount / rateRubPerUsdt;
        const res = await exchangeOrderMutation.mutateAsync({ amountUsdt });
        if (res.success) {
          handleCheckoutSuccess(navigate, resetCashForm, {
            toastMessage: t("cashOrder.withdrawCreated", {
              amount: Math.round(res.amountRub).toLocaleString(getDateLocale()).replace(/\u00a0/g, " "),
            }),
          });
        } else {
          toast.error(t("validation.submitError"));
        }
      } catch (err) {
        console.error(err);
        toast.error(t("validation.submitError"));
      }
    },
    [
      applyValidationErrors,
      clearErrors,
      exchangeOrderMutation,
      hasValidAmount,
      insufficientFunds,
      mode,
      navigate,
      parsedAmount,
      rateRubPerUsdt,
      resetCashForm,
      state.firstName,
      state.lastName,
      state.middleName,
      state.rememberData,
      submitMutation,
      t,
      telegramUserId,
      updateFullnameMutation,
      walletQuery.data,
    ]
  );

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col pt-4">
      <PageHeader
        title={mode === "deposit" ? t("cashOrder.depositTitle") : t("cashOrder.withdrawTitle")}
        compact
      />

      <form onSubmit={handleSubmit} className="mt-4 flex flex-1 flex-col">
        <div>
          <div className="mb-4">
            <OfficeSummaryCard />
          </div>
          <div className="space-y-3">
            <CashAmountCard
              label={mode === "deposit" ? t("cashOrder.youPay") : t("cashOrder.youReceive")}
              amount={amount}
              error={amountError}
              onChange={handleAmountChange}
              onBlur={handleAmountBlur}
            />
            {amountError ? (
              <p className="px-4 text-sm font-medium text-red-400">{amountError}</p>
            ) : null}

            <CashPersonalForm
              firstName={state.firstName}
              lastName={state.lastName}
              middleName={state.middleName}
              remember={state.rememberData}
              errorMessage={state.nameError}
              onFirstNameChange={(value) => setNamePart("firstName", value)}
              onLastNameChange={(value) => setNamePart("lastName", value)}
              onMiddleNameChange={(value) => setNamePart("middleName", value)}
              onRememberChange={setRememberData}
            />

            <CashBalanceCard
              balanceRub={balanceRub}
              loading={balanceQuery.isLoading || rateQuery.isLoading}
            />

            {insufficientFunds ? (
              <p className="px-4 text-sm font-medium text-red-400">
                {t("exchange.insufficientFunds")}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-auto pt-16">
          <CashConfirmPanel disabled={submitDisabled} isSubmitting={isSubmitting} />
        </div>
      </form>
    </div>
  );
}
