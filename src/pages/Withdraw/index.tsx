import { useMemo, useState, useEffect } from "react";

import { useTranslation } from "react-i18next";

import ExchangeWidget from "@/components/common/ExchangeWidget";

import WalletBalanceBlock from "@/components/common/WalletBalanceBlock";

import sandwatchImg from "@/assets/images/sandwatch.png";

import { useBackButton } from "@/hooks/useBackButton";

import { useExchangeForm } from "@/hooks/useExchangeForm";

import { useExchangeStore } from "@/store/useExchangeStore";

import { useLumoBalanceQuery, useLumoWalletQuery } from "@/api/lumoHooks";

import { BALANCE_EXCHANGE_FEE_USDT } from "@/constants/exchange";



type TabId = "rufin" | "address";



function formatUsdt(value: number) {

  // keep 2 decimals in UI + spaces

  return value

    .toFixed(2)

    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");

}



export default function Withdraw() {

  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabId>("rufin");

  const setDirection = useExchangeStore((s) => s.setDirection);

  const setFromAmount = useExchangeStore((s) => s.setFromAmount);

  const fromAmount = useExchangeStore((s) => s.fromAmount);

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

    if (activeTab === "rufin") {

      setDirection("SELL");

      setFromAmount("");

    }

  }, [activeTab, setDirection, setFromAmount]);



  return (

    <div className="p-4">

      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">

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

          <div className="w-full space-y-3">

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

          <div className="flex w-full flex-col items-center gap-4 p-6">

            <img src={sandwatchImg} alt="" className="h-24 w-auto object-contain" />

            <p className="text-center w-[250px] font-bold text-[20px] text-white">

              {t("withdraw.development")}

            </p>

          </div>

        )}

      </div>

    </div>

  );

}

