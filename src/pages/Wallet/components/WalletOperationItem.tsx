import type { ReactNode } from "react";

type WalletOperationItemProps = {
  logo: ReactNode;
  text: string;
  onClick?: () => void;
};

export default function WalletOperationItem({ logo, text, onClick }: WalletOperationItemProps) {
  return (
    <button type="button" className="operations-item" onClick={onClick}>
      <div className="operations-item-left">
        <div className="operations-item__logo">{logo}</div>
        <div className="operations-item__text">{text}</div>
      </div>
      <div className="operations-item__next" aria-hidden>
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6.45557 5.61768C6.45557 5.8335 6.37939 6.01758 6.20801 6.18262L1.25684 11.0259C1.11719 11.1655 0.945801 11.2354 0.742676 11.2354C0.330078 11.2354 0 10.918 0 10.499C0 10.2959 0.0888672 10.1118 0.222168 9.97217L4.69092 5.61768L0.222168 1.26318C0.0825195 1.11719 0 0.933105 0 0.72998C0 0.317383 0.330078 0 0.742676 0C0.945801 0 1.11719 0.0698242 1.25684 0.209473L6.20801 5.05273C6.37305 5.21777 6.45557 5.40186 6.45557 5.61768Z"
            fill="white"
          />
        </svg>
      </div>
    </button>
  );
}
