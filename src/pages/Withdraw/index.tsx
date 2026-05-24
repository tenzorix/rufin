import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ExchangeWidget from "@/components/common/ExchangeWidget";
import WalletBalanceBlock from "@/components/common/WalletBalanceBlock";
import { useBackButton } from "@/hooks/useBackButton";
import { useExchangeForm } from "@/hooks/useExchangeForm";
import { useExchangeStore } from "@/store/useExchangeStore";
import { useLumoBalanceQuery, useLumoWalletQuery } from "@/api/lumoHooks";
import { BALANCE_EXCHANGE_FEE_USDT } from "@/constants/exchange";
import UsdtTronIcon from "@/assets/icons/UsdtTronIcon";
import UsdtOperationIcon from "@/assets/icons/UsdtOperationIcon";
import WalletPicker from "@/pages/ExchangeCheckout/components/WalletPicker";
import { useQrScanner } from "@/hooks/useQrScanner";
import { formatAmountForUi, sanitizeExchangeInput } from "@/utils/exchangeInput";
import { formatUsdAmount, parseAmount } from "@/utils/exchangeCalculations";

type TabId = "rufin" | "address";
const FALLBACK_USDT_RUB_RATE = 77.3;

function formatUsdt(value: number) {
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatRub(value: number) {
  return Math.round(value).toLocaleString("ru-RU").replace(/\u00a0/g, " ");
}

function ScanIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M0.75 4.55V2.5C0.75 1.53 1.53 0.75 2.5 0.75H4.55M9.45 0.75H11.5C12.47 0.75 13.25 1.53 13.25 2.5V4.55M13.25 9.45V11.5C13.25 12.47 12.47 13.25 11.5 13.25H9.45M4.55 13.25H2.5C1.53 13.25 0.75 12.47 0.75 11.5V9.45"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M3.75 7H10.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RateExchangeIcon() {
  return (
    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M5.68052 4.99236L6.65037 5.98672L6.86227 6.22729L6.83782 5.50557V0.533771C6.83782 0.229047 7.07009 0.000504464 7.37979 0.000504464C7.69356 0.000504464 7.92584 0.229047 7.92584 0.533771V5.50557L7.90139 6.22328L8.10106 5.99875L9.08313 4.99236C9.185 4.88811 9.31133 4.83999 9.4621 4.83999C9.77588 4.83999 10 5.05651 10 5.36925C10 5.50557 9.9348 5.65794 9.83293 5.75416L7.78321 7.82709C7.55909 8.05964 7.20049 8.05563 6.97637 7.82709L4.93073 5.75416C4.82885 5.65794 4.76365 5.50557 4.76365 5.36925C4.76365 5.05651 4.98778 4.83999 5.30155 4.83999C5.44825 4.83999 5.57865 4.88811 5.68052 4.99236ZM0.91687 3.00764C0.814996 3.11189 0.688672 3.16001 0.537897 3.16001C0.224124 3.16001 0 2.94349 0 2.63075C0 2.49443 0.0651997 2.34206 0.167074 2.24183L2.21679 0.172914C2.44091 -0.0556288 2.79544 -0.0596383 3.01956 0.172914L5.06927 2.24183C5.17115 2.34206 5.23635 2.49443 5.23635 2.63075C5.23635 2.94349 5.01223 3.16001 4.69845 3.16001C4.54768 3.16001 4.42135 3.11189 4.31948 3.00764L3.33741 1.99725L3.13773 1.77672L3.16218 2.49443V7.46222C3.16218 7.77095 2.92991 7.9995 2.62021 7.9995C2.30644 7.9995 2.07416 7.77095 2.07416 7.46222V2.49443L2.09861 1.77271L1.88672 2.00927L0.91687 3.00764Z"
        fill="white"
      />
    </svg>
  );
}

function AddressCurrencySelect() {
  return (
    <div className="flex h-16 w-full items-center justify-between self-stretch rounded-[24px] bg-white/[0.06] px-4 py-2 text-left">
      <div className="flex items-center gap-2">
        <div className="relative h-[38px] w-[38px] shrink-0 overflow-visible [&>svg]:block [&>svg]:h-[38px] [&>svg]:w-[38px] [&>svg]:translate-y-[3px]">
          <UsdtTronIcon />
        </div>
        <div className="flex flex-col items-start py-1">
          <div className="text-[14px] font-bold leading-normal text-white">USDT</div>
          <div className="text-[12px] leading-[100%] [font-weight:510] text-white/60">TRC20</div>
        </div>
      </div>
    </div>
  );
}

type AddressSourceCardProps = {
  available: number;
};

function AddressSourceCard({ available }: AddressSourceCardProps) {
  const { t } = useTranslation();
  const [availableWhole, availableFraction] = formatUsdt(available).split(".");

  return (
    <div className="flex h-10 w-full items-center gap-2">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-white/[0.08] p-2 text-white">
        <UsdtOperationIcon />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[18px] font-bold leading-none text-white">
          <span>$ {availableWhole}</span>
          {availableFraction && <span className="text-white opacity-40">.{availableFraction}</span>}
        </div>
        <div className="mt-1 flex min-w-0 items-center text-[13px] font-bold leading-none text-white/65">
          <span className="shrink-0">{t("withdraw.rufinSource")}</span>
        </div>
      </div>
    </div>
  );
}

type AddressWithdrawFormProps = {
  available: number;
  sellRate: number;
};

function AddressWithdrawForm({ available, sellRate }: AddressWithdrawFormProps) {
  const { t } = useTranslation();
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const { scan } = useQrScanner({
    text: t("walletInput.scanPrompt"),
    onScanned: setAddress,
  });

  const parsedAmount = parseAmount(amount);
  const approximateRub = useMemo(() => {
    const base = parsedAmount && parsedAmount > 0 ? parsedAmount : available;
    const rate = sellRate > 0 ? sellRate : FALLBACK_USDT_RUB_RATE;
    if (!base) return null;
    return base * rate;
  }, [available, parsedAmount, sellRate]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) setAddress(text.trim());
    } catch {
      // Clipboard access can be blocked outside Telegram/browser gestures.
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(sanitizeExchangeInput(e.target.value));
  };

  const handleMax = () => {
    setAmount(available > 0 ? formatUsdAmount(available) : "");
  };

  return (
    <div className="mt-8 flex w-full flex-col items-stretch pb-[112px]">
      <AddressCurrencySelect />

      <div className="mt-2 flex h-12 w-full items-center rounded-[20px] bg-white/[0.04] px-4">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t("withdraw.addressPlaceholder")}
          className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-white outline-none placeholder:text-white/30"
        />
        <button
          type="button"
          onClick={handlePaste}
          className="ml-2 shrink-0 text-[14px] leading-[14px] font-medium text-white transition-colors active:text-white/70 [-webkit-tap-highlight-color:transparent]"
        >
          {t("withdraw.paste")}
        </button>
        <button
          type="button"
          onClick={scan}
          className="ml-4 flex h-[14px] w-[14px] shrink-0 items-center justify-center text-white/80 transition-colors active:text-white [-webkit-tap-highlight-color:transparent]"
          aria-label={t("walletInput.scanQr")}
        >
          <ScanIcon />
        </button>
      </div>

      <div className="mt-6 flex h-12 w-full items-center rounded-[20px] bg-white/[0.04] px-4">
        <input
          type="text"
          inputMode="decimal"
          value={formatAmountForUi(amount)}
          onChange={handleAmountChange}
          placeholder={t("withdraw.amountPlaceholder")}
          className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-white outline-none placeholder:text-white/30"
        />
        <span className="ml-2 shrink-0 text-[14px] font-bold text-white">USDT</span>
      </div>

      <div className="mt-1 flex items-center justify-between gap-3 px-4 text-[12px] leading-none text-white/70">
        <div className="flex items-center gap-1">
          <span>
            {approximateRub == null ? "≈ — ₽" : `≈ ${formatRub(approximateRub)}₽`}
          </span>
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white/20 text-white/80">
            <RateExchangeIcon />
          </span>
        </div>
        <button
          type="button"
          onClick={handleMax}
          className="font-medium text-white transition-colors active:text-white/70 [-webkit-tap-highlight-color:transparent]"
        >
          {t("exchange.max")}
        </button>
      </div>

      <div className="fixed bottom-6 left-1/2 z-20 flex w-[calc(100%-32px)] max-w-md -translate-x-1/2 flex-col gap-3">
        <AddressSourceCard available={available} />
        <button
          type="button"
          disabled
          className="h-10 w-full rounded-[14px] bg-white/30 text-center text-[14px] font-bold text-white/70 disabled:cursor-not-allowed [-webkit-tap-highlight-color:transparent]"
        >
          {t("withdraw.next")}
        </button>
      </div>

      <WalletPicker
        open={pickerOpen}
        selectedAddress={address}
        onClose={() => setPickerOpen(false)}
        onSelect={(selectedAddress) => {
          setAddress(selectedAddress);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}

export default function Withdraw() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>("rufin");
  const setDirection = useExchangeStore((s) => s.setDirection);
  const setFromAmount = useExchangeStore((s) => s.setFromAmount);
  const fromAmount = useExchangeStore((s) => s.fromAmount);
  const sellRate = useExchangeStore((s) => s.sellRate);
  useBackButton();

  const balanceQuery = useLumoBalanceQuery({ refetchInterval: 10_000 });
  const walletQuery = useLumoWalletQuery();

  const available = balanceQuery.data?.available ?? 0;
  const walletAddress = walletQuery.data?.address ?? "—";

  const parsedFrom = useMemo(() => {
    if (fromAmount.trim() === "") return null;
    const n = Number(fromAmount);
    return Number.isFinite(n) ? n : null;
  }, [fromAmount]);

  const { disabled: exchangeDisabled, onSubmit } = useExchangeForm({
    fromWithdraw: true,
    sellPreviewCommissionUsd: 0,
  });

  const insufficientFunds =
    parsedFrom != null &&
    parsedFrom > 0 &&
    parsedFrom + BALANCE_EXCHANGE_FEE_USDT > available;

  const disabledSubmit = exchangeDisabled || insufficientFunds;

  useEffect(() => {
    setDirection("SELL");
    if (activeTab === "rufin") setFromAmount("");
  }, [activeTab, setDirection, setFromAmount]);

  return (
    <div className="p-4">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        <div className="flex w-full justify-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("rufin")}
            className="relative pb-2 text-base font-medium transition-colors [-webkit-tap-highlight-color:transparent]"
          >
            <span className={activeTab === "rufin" ? "text-white" : "text-white/50"}>
              {t("withdraw.tabRufin")}
            </span>
            {activeTab === "rufin" && (
              <span className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-white" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("address")}
            className="relative pb-2 text-base font-medium transition-colors [-webkit-tap-highlight-color:transparent]"
          >
            <span className={activeTab === "address" ? "text-white" : "text-white/50"}>
              {t("withdraw.tabAddress")}
            </span>
            {activeTab === "address" && (
              <span className="absolute bottom-0 left-1/2 h-0.5 w-16 -translate-x-1/2 rounded-full bg-white" />
            )}
          </button>
        </div>

        {activeTab === "rufin" ? (
          <div className="mt-4 w-full space-y-3">
            <ExchangeWidget
              showSwapButton={false}
              showMaxButton
              withdrawGrossUsdMode
              fromWithdraw
              withdrawAvailableUsd={available}
              withdrawFeeUsd={BALANCE_EXCHANGE_FEE_USDT}
            />

            <WalletBalanceBlock
              forceCurrency="USD"
              balance={formatUsdt(available)}
              address={walletAddress}
            />

            <button
              type="button"
              disabled={disabledSubmit}
              onClick={onSubmit}
              className="w-full rounded-2xl bg-white py-3 text-center text-sm font-bold text-[#080C18] transition-colors disabled:cursor-not-allowed disabled:bg-[#434650] disabled:text-white/70 focus:outline-none [-webkit-tap-highlight-color:transparent]"
            >
              {t("exchange.createOrder")}
            </button>
          </div>
        ) : (
          <AddressWithdrawForm available={available} sellRate={sellRate} />
        )}
      </div>
    </div>
  );
}
