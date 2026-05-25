import type { KeyboardEvent } from "react";
import ArrowOperationIcon from "@/assets/icons/ArrowOperationIcon";
import DotsIcon from "../../assets/svg/dots";
import type { HistoryOperationViewModel } from "../../hooks/useUserData";
import { useI18n } from "../../i18n";
import type { CurrencyId } from "../header/Header";

const ORDER_PROCESSING_STATUSES = new Set([
  "in_progress",
  "in_progres",
  "created",
]);

const ORDER_ERROR_STATUSES = new Set([
  "failed",
  "expired_by_system",
  "expired_no_taker",
  "expired_by_user",
]);

interface HistoryOperationProps {
  operation: HistoryOperationViewModel;
  isBalanceVisible: boolean;
  activeCurrency: CurrencyId;
  onClick?: (operation: HistoryOperationViewModel) => void;
}

export default function HistoryOperation({
  operation,
  isBalanceVisible,
  activeCurrency,
  onClick,
}: HistoryOperationProps) {
  const { t } = useI18n();
  const amountClass = operation.isPositive
    ? "historyOperationAmount historyOperationAmountGreen"
    : "historyOperationAmount";

  const orderStatus = operation.orderStatus?.trim().toLowerCase();
  const isPurchaseOperation = !operation.isDeposit && !operation.isTransfer;
  const purchaseStatusKind: "success" | "processing" | "error" | null =
    isPurchaseOperation && orderStatus
      ? ORDER_ERROR_STATUSES.has(orderStatus)
        ? "error"
        : ORDER_PROCESSING_STATUSES.has(orderStatus)
        ? "processing"
        : "success"
      : null;

  const isErrorState =
    (operation.isDeposit && operation.depositStatusKind === "error") ||
    purchaseStatusKind === "error";
  const isProcessingState =
    (operation.isDeposit && operation.depositStatusKind === "processing") ||
    purchaseStatusKind === "processing";

  const iconKind: "default" | "error" | "processing" = isErrorState
    ? "error"
    : isProcessingState
    ? "processing"
    : "default";
  const iconDirectionClass = operation.isDeposit
    ? "historyOperationIcon--topup"
    : "historyOperationIcon--payment";

  const operationClass = [
    "historyOperation",
    operation.isPositive ? "historyOperation--positive" : "",
    operation.isDeposit ? "historyOperation--deposit" : "",
    onClick ? "historyOperation--interactive" : "",
    operation.depositStatusKind && operation.isDeposit
      ? `historyOperation--deposit-${operation.depositStatusKind}`
      : "",
    purchaseStatusKind && purchaseStatusKind !== "success"
      ? `historyOperation--order-${purchaseStatusKind}`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const headerTitle =
    operation.isDeposit && operation.depositStatusKind === "error"
      ? t("history.depositError")
      : operation.title;

  const displayAmount = isBalanceVisible
    ? activeCurrency === "rub"
      ? operation.amountRub ?? operation.amount
      : operation.amountUsd ?? operation.amount
    : null;
  const isAmountHidden = displayAmount === null;

  const isInteractive = Boolean(onClick);

  const handleOperationClick = () => {
    if (!isInteractive || !onClick) {
      return;
    }
    onClick(operation);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOperationClick();
    }
  };

  return (
    <div
      className={operationClass}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? handleOperationClick : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
    >
      <div className="historyOperationInfo">
        <div
          className={`historyOperationIcon historyOperationIcon--${iconKind} ${iconDirectionClass}`}
        >
          <ArrowOperationIcon />
        </div>
        <div className="historyOperationInfoColumn">
          <span className="historyOperationInfoColumnHeader">{headerTitle}</span>
          <span>{operation.time}</span>
        </div>
      </div>
      <span
        className={`${amountClass}${
          isAmountHidden ? " historyOperationAmount--hidden" : ""
        }`}
      >
        {displayAmount !== null ? displayAmount : <DotsIcon />}
      </span>
    </div>
  );
}
