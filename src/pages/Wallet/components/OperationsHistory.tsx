import { ArrowDown, ArrowUpRight } from "lucide-react";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import BalanceSkeleton from "@/components/shared/BalanceSkeleton";

export type Transaction = {
  id: number;
  title: string;
  time: string;
  amount: string;
  dateLabel: string;
  incoming?: boolean;
};

type OperationsHistoryProps = {
  transactions: Transaction[];
};

export default function OperationsHistory({
  transactions,
}: OperationsHistoryProps) {
  const { assetsHidden } = usePreferencesStore();

  return (
    <section className="space-y-6 font-profile-rounded">
      {groupTransactionsByDate(transactions).map(({ date, items }, index) => (
        <div key={date + index}>
          <p className="mb-3 pl-2 text-xs font-semibold lowercase tracking-wide text-white/40">
            {date}
          </p>
          <div className="overflow-hidden rounded-[20px] bg-[#121622]">
            {items.map((tx, rowIndex) => (
              <div key={tx.id}>
                <div className="flex items-center gap-3 px-2 py-2 text-sm text-white/90">
                  <div className="flex size-[41px] items-center justify-center rounded-xl bg-[#303440]">
                    {tx.incoming ? (
                      <ArrowDown className="size-6" />
                    ) : (
                      <ArrowUpRight className="size-6 text-white" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-medium text-white">
                      {tx.title}
                    </span>
                    <span className="mt-0.5 text-xs text-white/50">
                      {tx.time}
                    </span>
                  </div>
                  <div className="flex min-h-[1.1em] min-w-[3.5em] items-center justify-end text-lg font-semibold">
                    {assetsHidden ? (
                      <BalanceSkeleton size="medium" />
                    ) : (
                      <span
                        className={`text-[20px] pr-2 ${tx.incoming ? "text-emerald-400" : "text-white"}`}
                      >
                        {tx.amount}
                      </span>
                    )}
                  </div>
                </div>
                {rowIndex < items.length - 1 && (
                  <div
                    className="mx-2 h-px shrink-0 bg-[#252934]"
                    aria-hidden
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function groupTransactionsByDate(transactions: Transaction[]) {
  const groups = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    const list = groups.get(tx.dateLabel) ?? [];
    list.push(tx);
    groups.set(tx.dateLabel, list);
  }

  return Array.from(groups.entries()).map(([date, items]) => ({
    date,
    items,
  }));
}