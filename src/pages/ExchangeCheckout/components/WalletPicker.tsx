import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { WalletIcon } from "@/assets/icons";
import { useLumoBalanceQuery, useLumoWalletQuery } from "@/api/lumoHooks";
import { getDateLocale } from "@/i18n";
import { useOrdersQuery } from "@/api/hooks";

type WalletPickerProps = {
  open: boolean;
  selectedAddress?: string;
  onClose: () => void;
  onSelect: (address: string) => void;
  /** Только просмотр внутреннего кошелька (вывод с баланса), без смены адреса */
  lockedToInternal?: boolean;
};

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 text-white">
    <path
      d="M16.667 5L7.5 14.167 3.333 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ANIMATION_DURATION = 500;

function formatUsdt(value: number) {
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function shortenAddress(address: string) {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatLastUsedDate(date: Date, locale: string) {
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
  });
}

export default function WalletPicker({
  open,
  selectedAddress = "",
  onClose,
  onSelect,
  lockedToInternal = false,
}: WalletPickerProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const { data: orders } = useOrdersQuery();
  const walletQuery = useLumoWalletQuery();
  const balanceQuery = useLumoBalanceQuery({ refetchInterval: 10_000 });

  const internalWalletAddress = walletQuery.data?.address ?? "";
  const internalWalletBalance = balanceQuery.data?.available ?? 0;
  const hasInternalWallet = internalWalletAddress.length > 0;
  const internalWalletLabel = hasInternalWallet
    ? shortenAddress(internalWalletAddress)
    : t("common.loadingEllipsis");
  const formattedInternalBalance = hasInternalWallet
    ? formatUsdt(internalWalletBalance)
    : t("common.loadingEllipsis");

  const previousWallets = useMemo(
    () => {
      if (!orders) return [];

      const lastUsedByAddress = new Map<string, Date>();

      for (const order of orders) {
        if (order.type !== "buy") continue;
        if (!order.usdt_address || !order.created_at) continue;
        const createdAt = new Date(order.created_at);
        const prev = lastUsedByAddress.get(order.usdt_address);
        if (!prev || createdAt > prev) {
          lastUsedByAddress.set(order.usdt_address, createdAt);
        }
      }

      return Array.from(lastUsedByAddress.entries())
        .map(([address, lastUsed]) => ({ address, lastUsed }))
        .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
    },
    [orders]
  );

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
  }, [open]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, ANIMATION_DURATION);
  };

  const handleSelect = (address: string) => {
    setVisible(false);
    setTimeout(() => onSelect(address), ANIMATION_DURATION);
  };

  if (!open) return null;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className={`fixed inset-0 z-40 bg-[#080c19]/80 backdrop-blur-sm transition-opacity duration-250 ease-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
        onKeyDown={(e) => e.key === "Escape" && handleClose()}
        aria-label={t("common.close")}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-[#080c19] px-5 pb-4 pt-3 transition-transform duration-250 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-picker-title"
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-white/30" aria-hidden />
        <h2
          id="wallet-picker-title"
          className="mb-6 text-center text-lg font-semibold text-white"
        >
          {t("walletPicker.title")}
        </h2>

        <section className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-white/60">
            {t("walletPicker.internal")}
          </h3>
          <button
            type="button"
            onClick={() => {
              if (!hasInternalWallet) return;
              if (lockedToInternal) handleClose();
              else handleSelect(internalWalletAddress);
            }}
            disabled={!hasInternalWallet}
            className={`flex w-full items-center gap-4 rounded-2xl bg-white/6 px-4 py-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              lockedToInternal ? "cursor-default" : "hover:bg-white/10"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
              <WalletIcon />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold text-white">
                $ {formattedInternalBalance}
              </div>
              <div className="truncate text-sm text-white/60">
                {internalWalletLabel}
              </div>
            </div>
            {selectedAddress === internalWalletAddress && <CheckIcon />}
          </button>
        </section>

        {!lockedToInternal && (
        <section>
          <h3 className="mb-3 text-sm font-medium text-white/60">
            {t("walletPicker.previouslyUsed")}
          </h3>
          <div className="space-y-2">
            {previousWallets.map((wallet) => {
              const isSelected = selectedAddress === wallet.address;
              return (
                <button
                  key={wallet.address}
                  type="button"
                  onClick={() => handleSelect(wallet.address)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white/6 px-4 py-3 text-left transition-colors hover:bg-white/10"
                >
                  <div className="min-w-0 flex-1">
                    <span className="break-all text-sm font-medium text-white">
                      {wallet.address}
                    </span>
                    <span className="mt-1 block text-xs text-white/50">
                      {formatLastUsedDate(wallet.lastUsed, getDateLocale())}
                    </span>
                  </div>
                  {isSelected && <CheckIcon />}
                </button>
              );
            })}
          </div>
        </section>
        )}
      </div>
    </>
  );
}
