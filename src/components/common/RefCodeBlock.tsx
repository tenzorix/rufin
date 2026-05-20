import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { shareRefLink } from "@/utils/shareRefLink";
import { cn } from "@/utils/cn";
import { telegramBotDeepLink } from "@/constants/env";

type RefCodeBlockProps = {
  refCode: string;
  onCopy?: () => void;
  onQrClick?: () => void;
  onShareClick?: () => void;
  showShareButton?: boolean;
  className?: string;
};
const ShareIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0.298828 8.88867C0.134766 8.72852 0.0429688 8.53711 0.0234375 8.31445C0.0078125 8.0918 0.103516 7.875 0.310547 7.66406L5.56055 2.40234L6.84375 1.22461C7.03516 1.04883 7.23438 0.966797 7.44141 0.978516C7.65234 0.990234 7.82812 1.07031 7.96875 1.21875C8.10547 1.35938 8.17773 1.53125 8.18555 1.73438C8.19727 1.9375 8.11523 2.13281 7.93945 2.32031L6.76172 3.60352L1.50586 8.85352C1.31055 9.04492 1.10156 9.13867 0.878906 9.13477C0.660156 9.13477 0.466797 9.05273 0.298828 8.88867ZM7.53516 4.52344L7.67578 1.50586L4.58203 1.63477H2.41406C2.17578 1.63477 1.9707 1.55664 1.79883 1.40039C1.63086 1.24414 1.54688 1.05273 1.54688 0.826172C1.54688 0.599609 1.62891 0.40625 1.79297 0.246094C1.96094 0.0820312 2.16992 0 2.41992 0H8.28516C8.55469 0 8.76953 0.0820312 8.92969 0.246094C9.09375 0.410156 9.17578 0.623047 9.17578 0.884766V6.74414C9.17578 6.99023 9.09375 7.19922 8.92969 7.37109C8.76562 7.53906 8.57031 7.62305 8.34375 7.62305C8.11328 7.62305 7.91992 7.53906 7.76367 7.37109C7.61133 7.20312 7.53516 6.99805 7.53516 6.75586V4.52344Z" fill="black" />
  </svg>

)
const QrCodeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.00781 6.92188C0.648438 6.92188 0 6.28125 0 4.89844V2.03125C0 0.648438 0.648438 0 2.00781 0H4.91406C6.27344 0 6.92188 0.648438 6.92188 2.03125V4.89844C6.92188 6.28125 6.27344 6.92188 4.91406 6.92188H2.00781ZM10.0234 6.92188C8.66406 6.92188 8.01562 6.28125 8.01562 4.89844V2.03125C8.01562 0.648438 8.66406 0 10.0234 0H12.9297C14.2891 0 14.9375 0.648438 14.9375 2.03125V4.89844C14.9375 6.28125 14.2891 6.92188 12.9297 6.92188H10.0234ZM1.90625 5.45312H5.01562C5.3125 5.45312 5.45312 5.3125 5.45312 5.00781V1.91406C5.45312 1.60938 5.3125 1.46875 5.01562 1.46875H1.90625C1.60156 1.46875 1.46875 1.60938 1.46875 1.91406V5.00781C1.46875 5.3125 1.60156 5.45312 1.90625 5.45312ZM9.92188 5.45312H13.0312C13.3359 5.45312 13.4688 5.3125 13.4688 5.00781V1.91406C13.4688 1.60938 13.3359 1.46875 13.0312 1.46875H9.92188C9.61719 1.46875 9.48438 1.60938 9.48438 1.91406V5.00781C9.48438 5.3125 9.61719 5.45312 9.92188 5.45312ZM2.71094 4.38281C2.57812 4.38281 2.53906 4.33594 2.53906 4.17969V2.73438C2.53906 2.59375 2.57812 2.53906 2.71094 2.53906H4.20312C4.32812 2.53906 4.38281 2.59375 4.38281 2.73438V4.17969C4.38281 4.33594 4.32812 4.38281 4.20312 4.38281H2.71094ZM10.75 4.38281C10.625 4.38281 10.5781 4.33594 10.5781 4.17969V2.73438C10.5781 2.59375 10.625 2.53906 10.75 2.53906H12.2422C12.375 2.53906 12.4297 2.59375 12.4297 2.73438V4.17969C12.4297 4.33594 12.375 4.38281 12.2422 4.38281H10.75ZM2.00781 14.9375C0.648438 14.9375 0 14.2969 0 12.9141V10.0469C0 8.66406 0.648438 8.01562 2.00781 8.01562H4.91406C6.27344 8.01562 6.92188 8.66406 6.92188 10.0469V12.9141C6.92188 14.2969 6.27344 14.9375 4.91406 14.9375H2.00781ZM8.59375 10.2109C8.46875 10.2109 8.42188 10.1641 8.42188 10.0078V8.5625C8.42188 8.42188 8.46875 8.36719 8.59375 8.36719H10.0859C10.2188 8.36719 10.2734 8.42188 10.2734 8.5625V10.0078C10.2734 10.1641 10.2188 10.2109 10.0859 10.2109H8.59375ZM12.8359 10.2109C12.7109 10.2109 12.6641 10.1641 12.6641 10.0078V8.5625C12.6641 8.42188 12.7109 8.36719 12.8359 8.36719H14.3281C14.4609 8.36719 14.5078 8.42188 14.5078 8.5625V10.0078C14.5078 10.1641 14.4609 10.2109 14.3281 10.2109H12.8359ZM1.90625 13.4688H5.01562C5.3125 13.4688 5.45312 13.3281 5.45312 13.0312V9.9375C5.45312 9.625 5.3125 9.48438 5.01562 9.48438H1.90625C1.60156 9.48438 1.46875 9.625 1.46875 9.9375V13.0312C1.46875 13.3281 1.60156 13.4688 1.90625 13.4688ZM10.7344 12.3359C10.6094 12.3359 10.5625 12.2812 10.5625 12.1328V10.6797C10.5625 10.5391 10.6094 10.4844 10.7344 10.4844H12.2266C12.3594 10.4844 12.4141 10.5391 12.4141 10.6797V12.1328C12.4141 12.2812 12.3594 12.3359 12.2266 12.3359H10.7344ZM2.71094 12.3984C2.57812 12.3984 2.53906 12.3516 2.53906 12.1953V10.75C2.53906 10.6094 2.57812 10.5547 2.71094 10.5547H4.20312C4.32812 10.5547 4.38281 10.6094 4.38281 10.75V12.1953C4.38281 12.3516 4.32812 12.3984 4.20312 12.3984H2.71094ZM8.59375 14.4531C8.46875 14.4531 8.42188 14.3984 8.42188 14.25V12.8047C8.42188 12.6562 8.46875 12.6094 8.59375 12.6094H10.0859C10.2188 12.6094 10.2734 12.6562 10.2734 12.8047V14.25C10.2734 14.3984 10.2188 14.4531 10.0859 14.4531H8.59375ZM12.8359 14.4531C12.7109 14.4531 12.6641 14.3984 12.6641 14.25V12.8047C12.6641 12.6562 12.7109 12.6094 12.8359 12.6094H14.3281C14.4609 12.6094 14.5078 12.6562 14.5078 12.8047V14.25C14.5078 14.3984 14.4609 14.4531 14.3281 14.4531H12.8359Z" fill="white" />
  </svg>
)

export default function RefCodeBlock({
  refCode,
  onCopy,
  onQrClick,
  onShareClick,
  showShareButton = true,
  className,
}: RefCodeBlockProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleQrClick = () => {
    if (onQrClick) {
      onQrClick();
    } else {
      navigate(`/ref-share?code=${encodeURIComponent(refCode)}`);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(telegramBotDeepLink(refCode));
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback ignored
    }
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="flex w-fit flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-between gap-2 rounded-[20px] bg-white/4 px-4 py-2">
            <span className="text-md font-bold tracking-wider text-white">
              {refCode}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? t("refCode.copied") : t("refCode.copyCode")}
              className="text-white/60 transition-colors [-webkit-tap-highlight-color:transparent]"
            >
              {copied ? (
                <Check className="size-5" />
              ) : (
                <Copy className="size-5 text-white" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleQrClick}
            aria-label={t("refCode.showQr")}
            className="flex shrink-0 items-center justify-center rounded-3xl bg-white/16 p-3 px-5 text-white transition-colors [-webkit-tap-highlight-color:transparent]"
          >
            <QrCodeIcon />
          </button>
        </div>

        {showShareButton && <button
          type="button"
          onClick={onShareClick ?? (() => shareRefLink(refCode))}
          className="flex w-full items-center justify-center gap-2 rounded-3xl border border-white/20 bg-white py-2 text-black transition-colors [-webkit-tap-highlight-color:transparent]"
        >
          <ShareIcon />
          <span className="text-sm font-bold">{t("referral.shareLink")}</span>
        </button>}
      </div>
    </div>
  );
}
