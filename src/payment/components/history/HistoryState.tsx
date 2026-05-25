import { useI18n } from "../../i18n";

interface HistoryStateProps {
  error: string | null;
  isEmpty: boolean;
  onRetry?: () => void;
}

export default function HistoryState({
  error,
  isEmpty,
  onRetry,
}: HistoryStateProps) {
  const { t } = useI18n();

  if (error) {
    return (
      <div className="historyState historyState--error">
        <span>{error}</span>
        {onRetry && (
          <button type="button" className="historyStateBtn" onClick={onRetry}>
            {t("history.retry")}
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return <div className="historyState">{t("history.empty")}</div>;
  }

  return null;
}

