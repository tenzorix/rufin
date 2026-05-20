import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { SBPIcon } from "@/assets/icons";

type SBPPromoBannerProps = {
  onClick?: () => void;
};

export default function SBPPromoBanner({ onClick }: SBPPromoBannerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate("/wallet");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative w-full overflow-hidden rounded-2xl mb-6 px-4 py-4 text-left text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
      style={{
        WebkitTapHighlightColor: "transparent",
        background: "linear-gradient(90deg, #0a1e46 0%, #0c378a 100%)",
      }}
    >
      <div className="absolute left-4 top-1/2 h-14 w-1 -translate-y-1/2 rounded-full bg-white/90" />

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 pl-4">
          <div className="truncate text-base font-semibold leading-tight">{t("sbpBanner.title")}</div>
          <div className="mt-0.5 whitespace-pre-line text-xs leading-snug text-white/70">
            {t("sbpBanner.subtitle")}
          </div>
        </div>

        <div className="flex h-13 min-w-13 items-center justify-center rounded-2xl bg-[#1E1347]">
          <SBPIcon />
        </div>
      </div>
    </button>
  );
}

