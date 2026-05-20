import BalanceSkeleton from "@/components/shared/BalanceSkeleton";
import { cn } from "@/utils/cn";

type MetricDisplayProps = {
  label: string;
  amount: string;
  subLabel?: string;
  hidden?: boolean;
  className?: string;
  sublabelClassName?: string;
};

export default function MetricDisplay({ label, amount, subLabel, hidden = false, className, sublabelClassName }: MetricDisplayProps) {
  return (
    <section className={cn("flex min-h-30 flex-col items-center px-6 pt-6 text-4xl text-white", className)}>
      <p className="m-0 text-sm text-white/60">{label}</p>
      <div className="mt-2 flex flex-col items-center gap-0.5">
        <div className="flex h-[1.15em] min-w-[5.5em] shrink-0 items-center justify-center overflow-hidden font-semibold leading-none tracking-tight sm:text-5xl">
          {hidden ? (
            <BalanceSkeleton size="large" />
          ) : (
            <span className="m-0">{amount}</span>
          )}
        </div>
        <div className="flex h-6 shrink-0 items-center justify-center">
          {subLabel && (
            <p
              className={cn(
                "m-0 inline-flex items-center rounded-[5px] px-1.5 pt-px text-sm font-medium text-white ring-1 ring-white/10",
                sublabelClassName,
                hidden && "invisible"
              )}
            >
              {subLabel}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}