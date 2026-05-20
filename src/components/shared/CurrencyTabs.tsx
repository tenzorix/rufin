import { useTranslation } from "react-i18next";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import { RubleIcon } from "@/components/shared/RubleIcon";

export default function CurrencyTabs() {
  const { t } = useTranslation();
  const { displayCurrency, assetsHidden, setDisplayCurrency, toggleAssetsHidden } =
    usePreferencesStore();

  const thumbClass =
    "pointer-events-none absolute inset-0 rounded-full bg-[#0295f9] shadow-[0_4px_16px_rgba(0,0,0,0.4)]";

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center gap-0.5 h-[30px] w-[57px] overflow-hidden rounded-[25px] bg-white/16 p-1">
        <div className="relative flex size-6 shrink-0 items-center justify-center">
          {displayCurrency === "RUB" && <span className={thumbClass} aria-hidden />}
          <button
            type="button"
            onClick={() => setDisplayCurrency("RUB")}
            aria-label={t("currencyTabs.rubAria")}
            className={`relative z-10 inline-flex size-full items-center justify-center rounded-full text-sm font-bold ${
              displayCurrency === "RUB" ? "text-white" : "text-white/60 hover:text-white"
            }`}
          >
            <RubleIcon className="size-6 shrink-0" />
          </button>
        </div>
        <div className="relative flex size-6 shrink-0 items-center justify-center">
          {displayCurrency === "USD" && <span className={thumbClass} aria-hidden />}
          <button
            type="button"
            onClick={() => setDisplayCurrency("USD")}
            aria-label={t("currencyTabs.usdAria")}
            className={`relative z-10 inline-flex size-full items-center justify-center rounded-full text-md font-bold ${
              displayCurrency === "USD" ? "text-white" : "text-white/60 hover:text-white"
            }`}
          >
            $
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={toggleAssetsHidden}
        className={`inline-flex h-[30px] w-10 items-center justify-center rounded-3xl transition-colors ${
          assetsHidden
            ? "bg-[#0295f9] text-white shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
            : "bg-white/16 text-white/70 hover:bg-white/12 hover:text-white"
        }`}
        aria-label={assetsHidden ? t("currencyTabs.showBalance") : t("currencyTabs.hideBalance")}
      >
        <svg
          width="16"
          height="12"
          viewBox="0 0 16 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            opacity={assetsHidden ? 1 : 0.4}
            d="M7.99131 11.41C7.18001 11.41 6.41893 11.3066 5.70808 11.0998C4.99722 10.8971 4.34432 10.6275 3.74937 10.2909C3.15828 9.95438 2.63093 9.58337 2.16733 9.1779C1.70373 8.77243 1.30967 8.36695 0.98515 7.96148C0.664494 7.55601 0.419172 7.18297 0.249185 6.84237C0.0830617 6.49772 0 6.222 0 6.0152C0 5.84491 0.05795 5.62595 0.17385 5.35834C0.293613 5.08667 0.467463 4.78865 0.6954 4.46427C0.923337 4.13583 1.2015 3.80132 1.52988 3.46072C1.86213 3.11607 2.24073 2.78358 2.6657 2.46325L5.20971 5.12722C5.16335 5.26913 5.12858 5.4151 5.1054 5.56513C5.08608 5.71515 5.07642 5.86721 5.07642 6.02129C5.07642 6.43487 5.15176 6.82413 5.30243 7.18905C5.45696 7.55398 5.66751 7.87836 5.93408 8.16219C6.20452 8.44197 6.51551 8.66295 6.86708 8.82514C7.2225 8.98327 7.60111 9.06234 8.0029 9.06234C8.14584 9.06234 8.28685 9.0522 8.42593 9.03193C8.56501 9.0076 8.70023 8.97314 8.83158 8.92853L10.7613 10.9539C10.3402 11.0958 9.89786 11.2073 9.43426 11.2884C8.97453 11.3695 8.49354 11.41 7.99131 11.41ZM13.3749 9.57324L10.8077 6.87278C10.8502 6.73898 10.8811 6.60111 10.9004 6.4592C10.9197 6.31728 10.9294 6.17131 10.9294 6.02129C10.9294 5.59959 10.8521 5.20628 10.6976 4.84136C10.5469 4.47238 10.3364 4.148 10.0659 3.86822C9.79935 3.58844 9.48835 3.37152 9.13292 3.21744C8.78136 3.0593 8.40469 2.98023 8.0029 2.98023C7.86768 2.98023 7.73246 2.99037 7.59725 3.01064C7.46203 3.03092 7.33068 3.0593 7.20319 3.09579L5.27925 1.07653C5.69262 0.938672 6.12532 0.831221 6.57733 0.754181C7.02934 0.673087 7.50066 0.632539 7.99131 0.632539C8.81806 0.632539 9.5888 0.735935 10.3035 0.942727C11.0221 1.14546 11.6789 1.4151 12.2738 1.75165C12.8688 2.08819 13.3961 2.4592 13.8559 2.86467C14.3156 3.26609 14.7039 3.66954 15.0206 4.07501C15.3413 4.48049 15.5847 4.85555 15.7508 5.2002C15.9169 5.5408 16 5.81247 16 6.0152C16 6.24633 15.8976 6.56057 15.6929 6.95793C15.4881 7.35124 15.1906 7.77902 14.8004 8.24126C14.4102 8.7035 13.935 9.14749 13.3749 9.57324ZM6.05578 6.07603C6.05578 6.06792 6.05578 6.06183 6.05578 6.05778C6.05578 6.04967 6.05771 6.04156 6.06157 6.03345L7.91018 7.97973C7.90631 7.97973 7.90052 7.97973 7.89279 7.97973C7.88893 7.97973 7.88313 7.97973 7.87541 7.97973C7.54316 7.97973 7.23796 7.89458 6.9598 7.72428C6.6855 7.55398 6.46529 7.32489 6.29917 7.037C6.13691 6.74506 6.05578 6.42473 6.05578 6.07603ZM9.90366 5.89964C9.90366 5.9037 9.90366 5.90978 9.90366 5.91789C9.90366 5.92195 9.90366 5.926 9.90366 5.93006L8.05505 3.98986C8.05892 3.98986 8.06278 3.98986 8.06664 3.98986C8.07437 3.98986 8.0821 3.98986 8.08982 3.98986C8.42207 3.98986 8.72534 4.07704 8.99964 4.25139C9.2778 4.42169 9.49801 4.65079 9.66027 4.93867C9.82253 5.22656 9.90366 5.54688 9.90366 5.89964ZM12.8243 11.8358L2.4397 0.948809C2.33925 0.843386 2.28903 0.713634 2.28903 0.559554C2.28903 0.401419 2.33925 0.26964 2.4397 0.164217C2.54014 0.054739 2.66377 0 2.81058 0C2.96125 0 3.08874 0.054739 3.19305 0.164217L13.5719 11.0512C13.6762 11.1607 13.7264 11.2904 13.7226 11.4404C13.7226 11.5945 13.6723 11.7263 13.5719 11.8358C13.4714 11.9453 13.3478 12 13.201 12C13.0542 12 12.9286 11.9453 12.8243 11.8358Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}

