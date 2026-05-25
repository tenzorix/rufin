import { NavLink, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { QRScanIcon, WalletIcon } from "@/assets/icons";
import RufinIcon from "@/assets/icons/RufinIcon";
import StockIcon from "@/assets/icons/StockIcon";

const UserIcon = () => {
  return (
    <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.03209 21C1.3983 21 0.899188 20.8598 0.534759 20.5795C0.178253 20.307 0 19.9294 0 19.4466C0 18.6913 0.229748 17.901 0.689245 17.0756C1.14874 16.2425 1.81422 15.4638 2.68568 14.7397C3.55714 14.0078 4.60685 13.416 5.83482 12.9644C7.07071 12.505 8.45712 12.2753 9.99406 12.2753C11.5389 12.2753 12.9253 12.505 14.1533 12.9644C15.3892 13.416 16.4389 14.0078 17.3024 14.7397C18.1739 15.4638 18.8394 16.2425 19.2989 17.0756C19.7663 17.901 20 18.6913 20 19.4466C20 19.9294 19.8178 20.307 19.4534 20.5795C19.0969 20.8598 18.6017 21 17.9679 21H2.03209ZM10.0059 10.1846C9.15825 10.1846 8.37394 9.95884 7.653 9.50723C6.93207 9.04783 6.34977 8.4327 5.90612 7.66185C5.47039 6.8832 5.25253 6.01112 5.25253 5.04561C5.25253 4.09566 5.47039 3.23915 5.90612 2.47608C6.34977 1.71301 6.93207 1.10957 7.653 0.66574C8.37394 0.221913 9.15825 0 10.0059 0C10.8536 0 11.6379 0.21802 12.3589 0.65406C13.0798 1.0901 13.6582 1.68966 14.0939 2.45273C14.5375 3.20801 14.7594 4.06452 14.7594 5.02225C14.7594 5.99555 14.5375 6.87152 14.0939 7.65017C13.6582 8.42881 13.0798 9.04783 12.3589 9.50723C11.6379 9.95884 10.8536 10.1846 10.0059 10.1846Z" fill="white" />
    </svg>

  )
}

const getActiveIndex = (
  pathname: string,
  navItems: Array<{ to: string; matchPaths?: string[] }>
) => {
  const index = navItems.findIndex(
    (item) => item.matchPaths?.includes(pathname) ?? item.to === pathname
  );

  return index >= 0 ? index : 3;
};

const BottomNav = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navItems = [
    { to: "/wallet", icon: WalletIcon, label: t("nav.wallet") },
    { to: "/rufin", icon: RufinIcon, label: t("nav.rufin") },
    { to: "/payment", icon: QRScanIcon, label: t("nav.scan"), center: true },
    { to: "/", icon: StockIcon, label: t("nav.exchange"), matchPaths: ["/", "/home"] as string[] },
    { to: "/profile", icon: UserIcon, label: t("nav.profile") },
  ];
  const activeIndex = getActiveIndex(pathname, navItems);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pt-2"
      style={{
        paddingBottom:
          "max(12px, calc(var(--tg-viewport-safe-area-inset-bottom, 0px) + var(--tg-viewport-content-safe-area-inset-bottom, 0px)))",
      }}
    >
      <div
        className="mx-auto flex h-[62px] w-full max-w-md items-center justify-around rounded-[39px]"
        style={{
          background: "transparent",
        }}
      >
        <div
          className="relative h-full w-full rounded-[37.5px]"
          style={{
            background: "rgba(26, 27, 34, 0.2)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <div className="pointer-events-none absolute inset-y-1 left-1 right-1">
            <div
              className="h-full rounded-[34px] bg-white/12 transition-transform duration-300 ease-out"
              style={{
                width: "20%",
                transform: `translateX(${activeIndex * 100}%)`,
                boxShadow: "0 0 14px 4px rgba(255,255,255,0.07), inset 0 1px 0 0 rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            />
          </div>
          <div className="relative z-10 grid h-full grid-cols-5 px-1">
            {navItems.map(({ to, icon: Icon, label, matchPaths, center }) => {
              const isActive =
                matchPaths?.includes(pathname) ?? pathname === to;

              return (
                <NavLink
                  key={to}
                  to={to}
                  aria-label={label}
                  className={() =>
                    `flex h-[54px] flex-col items-center justify-center gap-0.5 self-center rounded-[34px] transition-colors duration-200 ${
                      isActive ? "text-white" : "text-white/80 hover:text-white"
                    }`
                  }
                >
                  {center ? (
                    <span className="flex h-16 w-16 aspect-square shrink-0 flex-col items-center justify-center gap-1 rounded-[39px] bg-white text-black shadow-[0_4px_12px_0_rgba(255,255,255,0.25)]">
                      <span className="flex h-5 w-5 aspect-square shrink-0 items-center justify-center [&_svg]:h-5 [&_svg]:w-5">
                        <Icon />
                      </span>
                    </span>
                  ) : (
                    <>
                      <span className="inline-flex size-6 -translate-y-px items-center justify-center text-white [&_svg]:max-h-6 [&_svg]:w-auto">
                        <Icon />
                      </span>
                      <span className="max-w-full -translate-y-px truncate px-1 text-[10px] font-medium leading-none">
                        {label}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
