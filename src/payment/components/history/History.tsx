import { useI18n } from "../../i18n";
import type {
  HistoryGroupViewModel,
  HistoryOperationViewModel,
} from "../../hooks/useUserData";
import type { CurrencyId } from "../header/Header";
import HistorySkeleton from "./HistorySkeleton";
import HistoryState from "./HistoryState";
import HistoryGroup from "./HistoryGroup";

interface HistoryProps {
  history: HistoryGroupViewModel[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  isBalanceVisible: boolean;
  activeCurrency: CurrencyId;
  onOperationClick?: (operation: HistoryOperationViewModel) => void;
  className?: string;
}

export default function History({
  history,
  isLoading,
  error,
  onRetry,
  isBalanceVisible,
  activeCurrency,
  onOperationClick,
  className,
}: HistoryProps) {
  const { t } = useI18n();
  const hasHistory = history.length > 0;

  return (
    <div className={className ? `history ${className}` : "history"}>
      <span className="historyHeader">{t("history.title")}</span>

      <HistoryState
        error={error}
        isEmpty={!isLoading && !error && !hasHistory}
        onRetry={error ? onRetry : undefined}
      />

      {isLoading && !hasHistory && <HistorySkeleton />}

      {history.map((group) => (
        <HistoryGroup
          key={group.id}
          group={group}
          isBalanceVisible={isBalanceVisible}
          activeCurrency={activeCurrency}
          onOperationClick={onOperationClick}
        />
      ))}
    </div>
  );
}
