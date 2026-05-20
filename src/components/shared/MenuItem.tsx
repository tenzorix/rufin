import { ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import BalanceSkeleton from "@/components/shared/BalanceSkeleton";

export type MenuItemProps = {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value?: React.ReactNode;
  sensitive?: boolean;
  onClick?: () => void;
  clickable?: boolean;
  showChevron?: boolean;
  inGroup?: boolean;
  isLastInGroup?: boolean;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
};

export default function MenuItem({
  icon: Icon,
  label,
  value,
  sensitive = false,
  onClick,
  clickable = true,
  showChevron = clickable,
  inGroup,
  isLastInGroup,
  className,
  labelClassName,
  valueClassName,
}: MenuItemProps) {
  const { assetsHidden } = usePreferencesStore();
  const shouldHideValue = sensitive && assetsHidden;
  const isInteractive = clickable || !!onClick;

  const baseClassName = cn(
    "relative flex w-full items-center gap-3 px-2 py-2 text-left [-webkit-tap-highlight-color:transparent]",
    inGroup ? "" : "rounded-xl border border-white/10",
    isInteractive && "transition-colors cursor-pointer",
    className
  );

  const content = (
    <>
      {Icon && <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/80">
        <Icon className="size-4" />
      </div>
      }
      <span className={cn("flex-1 text-sm font-medium text-white", labelClassName)}>{label}</span>
      {value != null && (
        <span className="flex min-h-[1em] min-w-[2.5em] items-center justify-end">
          {shouldHideValue ? (
            <BalanceSkeleton size="small" />
          ) : (
            <span className={cn("truncate text-sm text-white/60", valueClassName)}>{value}</span>
          )}
        </span>
      )}
      {showChevron && <ChevronRight className="size-4 shrink-0 mr-1 text-white" />}
      {!showChevron && <div className="mr-1 text-white" />}
    </>
  );

  const wrapper = (
    <>
      {content}
      {inGroup && !isLastInGroup && (
        <div className="absolute bottom-0 left-2 right-2 h-px bg-white/10" />
      )}
    </>
  );

  if (isInteractive) {
    return (
      <button type="button" onClick={onClick} className={baseClassName}>
        {wrapper}
      </button>
    );
  }

  return <div className={baseClassName}>{wrapper}</div>;
}
