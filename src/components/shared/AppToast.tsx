import { Check, CircleX } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import { clsx } from "clsx";

export default function AppToast() {
  const message = useToastStore((s) => s.message);
  const variant = useToastStore((s) => s.variant);
  if (!message) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 56px)" }}
    >
      <div
        className={clsx(
          "pointer-events-auto flex max-w-md items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur",
          variant === "success" && "bg-white/10",
          variant === "error" && "border border-red-400/35 bg-red-500/15"
        )}
      >
        {variant === "success" ? (
          <Check className="size-4 shrink-0 text-emerald-300/95" strokeWidth={2.5} aria-hidden />
        ) : (
          <CircleX className="size-4 shrink-0 text-red-300/95" strokeWidth={2} aria-hidden />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
}
