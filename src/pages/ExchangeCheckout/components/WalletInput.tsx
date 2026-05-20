import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { WalletIcon } from "@/assets/icons";
import WalletPicker from "./WalletPicker";
import { useLumoBalanceQuery, useLumoWalletQuery } from "@/api/lumoHooks";
import { useQrScanner } from "@/hooks/useQrScanner";

type WalletInputProps = {
  initialAddress?: string;
  /** Заблокировать удаление внутреннего кошелька (со страницы Withdraw) */
  lockInternalWallet?: boolean;
  errorMessage?: string | null;
  onAddressChange?: (address: string) => void;
};

function formatUsdt(value: number) {
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function shortenAddress(address: string) {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function WalletInput({
  initialAddress = "",
  lockInternalWallet = false,
  errorMessage = null,
  onAddressChange,
}: WalletInputProps) {
  const { t } = useTranslation();
  const [address, setAddress] = useState(initialAddress);
  const [pickerOpen, setPickerOpen] = useState(false);
  const hasAppliedInitial = useRef(false);
  const walletQuery = useLumoWalletQuery();
  const balanceQuery = useLumoBalanceQuery({ refetchInterval: 10_000 });

  useEffect(() => {
    if (initialAddress && !hasAppliedInitial.current) {
      setAddress(initialAddress);
      hasAppliedInitial.current = true;
      onAddressChange?.(initialAddress);
    }
  }, [initialAddress, onAddressChange]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { scan: scanQr } = useQrScanner({
    text: t("walletInput.scanPrompt"),
    onScanned: setAddress,
  });

  const internalWalletAddress = walletQuery.data?.address ?? "";
  const internalWalletBalance = balanceQuery.data?.available ?? 0;
  const internalWalletShortAddress = internalWalletAddress
    ? shortenAddress(internalWalletAddress)
    : t("common.loadingEllipsis");
  const internalWalletBalanceLabel = internalWalletAddress
    ? formatUsdt(internalWalletBalance)
    : t("common.loadingEllipsis");
  const isInternalWallet = internalWalletAddress.length > 0 && address === internalWalletAddress;
  const shouldShowInternalWallet = lockInternalWallet || isInternalWallet;
  const [balanceInt, balanceDec] = internalWalletBalanceLabel.includes(".")
    ? internalWalletBalanceLabel.split(".")
    : [internalWalletBalanceLabel, ""];

  const handleSelectWallet = (selectedAddress: string) => {
    setAddress(selectedAddress);
    onAddressChange?.(selectedAddress);
    setPickerOpen(false);
  };

  return (
    <>
      <input type="hidden" name="usdt_address" value={address} />
      <div
        role={shouldShowInternalWallet && !lockInternalWallet ? "button" : undefined}
        tabIndex={shouldShowInternalWallet && !lockInternalWallet ? 0 : undefined}
        onClick={shouldShowInternalWallet && !lockInternalWallet ? () => setPickerOpen(true) : undefined}
        onKeyDown={shouldShowInternalWallet && !lockInternalWallet ? (e) => e.key === "Enter" && setPickerOpen(true) : undefined}
        className={`flex items-center gap-3 rounded-3xl px-3 py-1.5 ${shouldShowInternalWallet ? (lockInternalWallet ? "gap-2 bg-white/4 rounded-[20px]" : " rounded-[20px] cursor-pointer bg-white/7 hover:bg-white/15 transition-colors") : "gap-2 bg-white/4"
          }`}
      >
        {shouldShowInternalWallet ? (
          <>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#33343C] text-white">
              <WalletIcon />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-white">
                $ {balanceInt}
                {balanceDec && <span className="font-normal text-white/60">.{balanceDec}</span>}
              </div>
              <div className="text-sm text-white/50">{internalWalletShortAddress}</div>
            </div>
            {!lockInternalWallet && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setAddress("");
                  onAddressChange?.("");
                  inputRef.current?.focus();
                }}
                className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                aria-label={t("walletInput.restoreInput")}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </>
        ) : (
          <>
            <input
              ref={inputRef}
              id="usdt-address"
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                onAddressChange?.(e.target.value);
              }}
              className="h-10 flex-1 bg-transparent px-2 text-base text-white placeholder:text-white/30 outline-none"
              placeholder={t("walletInput.placeholder")}
            />
            {address ? (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setAddress("");
                  onAddressChange?.("");
                  inputRef.current?.focus();
                }}
                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                aria-label={t("walletInput.clear")}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={scanQr}
                className="flex h-8 min-w-8 items-center justify-center rounded-xl text-white/80"
                aria-label={t("walletInput.scanQr")}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.69223 4.71378C0.230743 4.71378 0 4.47821 0 4.00707V2.28975C0 1.53592 0.195426 0.965842 0.586277 0.579505C0.977127 0.193168 1.55399 0 2.31685 0H4.0333C4.4995 0 4.73259 0.23086 4.73259 0.69258C4.73259 1.15901 4.4995 1.39223 4.0333 1.39223H2.40161C2.07198 1.39223 1.82005 1.47703 1.64581 1.64664C1.47629 1.81625 1.39152 2.07303 1.39152 2.41696V4.00707C1.39152 4.47821 1.15843 4.71378 0.69223 4.71378ZM13.3007 4.71378C12.8392 4.71378 12.6085 4.47821 12.6085 4.00707V2.41696C12.6085 2.07303 12.519 1.81625 12.3401 1.64664C12.1658 1.47703 11.9162 1.39223 11.5913 1.39223H9.95964C9.49344 1.39223 9.26034 1.15901 9.26034 0.69258C9.26034 0.23086 9.49344 0 9.95964 0H11.6761C12.4437 0 13.0229 0.193168 13.4137 0.579505C13.8046 0.965842 14 1.53592 14 2.28975V4.00707C14 4.47821 13.7669 4.71378 13.3007 4.71378ZM2.31685 14C1.55399 14 0.977127 13.8045 0.586277 13.4134C0.195426 13.0271 0 12.457 0 11.7032V9.99293C0 9.52179 0.230743 9.28622 0.69223 9.28622C1.15843 9.28622 1.39152 9.52179 1.39152 9.99293V11.583C1.39152 11.927 1.47629 12.1837 1.64581 12.3534C1.82005 12.523 2.07198 12.6078 2.40161 12.6078H4.0333C4.4995 12.6078 4.73259 12.841 4.73259 13.3074C4.73259 13.7691 4.4995 14 4.0333 14H2.31685ZM9.95964 14C9.49344 14 9.26034 13.7691 9.26034 13.3074C9.26034 12.841 9.49344 12.6078 9.95964 12.6078H11.5913C11.9162 12.6078 12.1658 12.523 12.3401 12.3534C12.519 12.1837 12.6085 11.927 12.6085 11.583V9.99293C12.6085 9.52179 12.8392 9.28622 13.3007 9.28622C13.7669 9.28622 14 9.52179 14 9.99293V11.7032C14 12.457 13.8046 13.0271 13.4137 13.4134C13.0229 13.8045 12.4437 14 11.6761 14H9.95964Z" fill="white" />
                  <path d="M10.5068 6.33008C10.8934 6.33008 11.2064 6.64302 11.2064 7.02962C11.2064 7.41622 10.8934 7.72917 10.5068 7.72917H3.50684C3.12024 7.72917 2.80729 7.41622 2.80729 7.02962C2.80729 6.64302 3.12024 6.33008 3.50684 6.33008H10.5068Z" fill="white" />
                </svg>

              </button>
            )}
          </>
        )}
      </div>

      {errorMessage && (
        <p className="mt-2 px-4 text-sm text-red-400">
          {errorMessage}
        </p>
      )}

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex w-full px-4 gap-1 items-center text-sm font-medium text-white/70 hover:text-white/90"
      >
        <span>{t("walletInput.selectWallet")} </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="text-white/70"
          aria-hidden
        >
          <path
            d="M6 4L10 8L6 12"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <WalletPicker
        open={pickerOpen}
        selectedAddress={address}
        lockedToInternal={lockInternalWallet}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectWallet}
      />
    </>
  );
}

