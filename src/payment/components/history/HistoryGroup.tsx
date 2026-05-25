import type {
  HistoryGroupViewModel,
  HistoryOperationViewModel,
} from "../../hooks/useUserData";
import type { CurrencyId } from "../header/Header";
import HistoryOperation from "./HistoryOperation";

interface HistoryGroupProps {
  group: HistoryGroupViewModel;
  isBalanceVisible: boolean;
  activeCurrency: CurrencyId;
  onOperationClick?: (operation: HistoryOperationViewModel) => void;
}

export default function HistoryGroup({
  group,
  isBalanceVisible,
  activeCurrency,
  onOperationClick,
}: HistoryGroupProps) {
  return (
    <div className="historyPart">
      <span className="historyPartDay">{group.label}</span>
      <div className="historyOperations">
        {group.operations.map((operation) => (
          <HistoryOperation
            key={operation.id}
            operation={operation}
            isBalanceVisible={isBalanceVisible}
            activeCurrency={activeCurrency}
            onClick={onOperationClick}
          />
        ))}
      </div>
    </div>
  );
}
