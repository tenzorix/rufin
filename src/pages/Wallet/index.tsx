import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import TopBar from "@/components/shared/TopBar";
import WalletBalance from "./components/WalletBalance";
import WalletActions from "./components/WalletActions";
import OperationsHistory, { type Transaction } from "./components/OperationsHistory";
import { useLumoBalanceHistoryQuery, useLumoRatesCurrentQuery } from "@/api/lumoHooks";

function formatTimeHM(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(date: Date, lang: string) {
  const isEn = lang.startsWith("en");
  return date.toLocaleDateString(isEn ? "en-US" : "ru-RU", {
    day: "2-digit",
    month: isEn ? "short" : "long",
  });
}

function mapTxTitle(type: string, t: TFunction) {
  switch (type) {
    case "deposit":
      return t("wallet.topUp", { defaultValue: "Пополнение" });
    case "qr_payment":
    case "payment":
      return t("wallet.purchase", { defaultValue: "Оплата" });
    default:
      return t("wallet.operation", { defaultValue: "Операция" });
  }
}

export default function Wallet() {
  const { t, i18n } = useTranslation();

  const historyQuery = useLumoBalanceHistoryQuery({ limit: 50, offset: 0 });
  const rateQuery = useLumoRatesCurrentQuery();
  const rateRubPerUsdt = rateQuery.data?.rate ?? null;

  const transactions: Transaction[] = useMemo(() => {
    const txs = historyQuery.data?.transactions ?? [];

    return txs.map((tx, idx) => {
      const createdAt = new Date(tx.created_at);
      const incoming = tx.amount > 0;

      // По умолчанию показываем в рублях (как было в моках), но если курс не загрузился — показываем в "$".
      let amountStr = "";
      if (rateRubPerUsdt != null) {
        const rub = Math.round(Math.abs(tx.amount) * rateRubPerUsdt);
        amountStr = `${incoming ? "+" : ""}${rub.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")}₽`;
      } else {
        amountStr = `${incoming ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}$`;
      }

      return {
        id: idx + 1,
        title: mapTxTitle(tx.type, t),
        time: formatTimeHM(createdAt),
        amount: amountStr,
        dateLabel: formatDateLabel(createdAt, i18n.language),
        incoming,
      };
    });
  }, [historyQuery.data?.transactions, i18n.language, rateRubPerUsdt, t]);

  return (
    <div className="p-4">
      <div className="mx-auto w-full max-w-md">
        <div className="space-y-6">
          <TopBar />
          <WalletBalance />
          <WalletActions />
          <OperationsHistory transactions={transactions} />
        </div>
      </div>
    </div>
  );
}
