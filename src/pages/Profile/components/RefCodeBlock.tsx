import { Check, Copy, QrCode, Share2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { shareRefLink } from "@/utils/shareRefLink";

type RefCodeBlockProps = {
  refCode?: string;
  onCopy?: () => void;
  onQrClick?: () => void;
  onShareClick?: () => void;
  showShareButton?: boolean;
};

export default function RefCodeBlock({
  refCode = "H4KS9B4",
  onCopy,
  onQrClick,
  onShareClick,
  showShareButton = true,
}: RefCodeBlockProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(refCode);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback ignored
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-fit flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-between gap-2 rounded-3xl border border-white/20 bg-white/4 px-4 py-3">
            <span className="text-lg font-bold tracking-wider text-white">
              {refCode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? t("refCode.copied") : t("refCode.copyCode")}
              className="text-white/60 transition-colors [-webkit-tap-highlight-color:transparent]"
            >
              {copied ? (
                <Check className="size-5 text-emerald-400" />
              ) : (
                <Copy className="size-5" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onQrClick}
            aria-label={t("refCode.showQr")}
            className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/20 text-white/60 transition-colors [-webkit-tap-highlight-color:transparent]"
          >
            <QrCode className="size-6" />
          </button>
        </div>

        {showShareButton && <button
          type="button"
          onClick={onShareClick ?? (() => shareRefLink(refCode))}
          className="flex w-full items-center justify-center gap-2 rounded-3xl border border-white/20 bg-white py-2 text-black transition-colors [-webkit-tap-highlight-color:transparent]"
        >
          <Share2 className="size-4" />
          <span className="text-sm font-bold">{t("referral.shareLink")}</span>
        </button>}
      </div>
    </div>
  );
}
