import { NavLink, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { WalletIcon } from "@/assets/icons";


const HomeIcon = () => {
  return (
    <svg width="24" height="21" viewBox="0 0 24 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.28643 19.3923H14.7136V13.5207C14.7136 13.2943 14.6432 13.1113 14.5025 12.9715C14.3685 12.8317 14.1843 12.7618 13.9497 12.7618H10.0603C9.8258 12.7618 9.63819 12.8317 9.49749 12.9715C9.35678 13.1113 9.28643 13.2943 9.28643 13.5207V19.3923ZM3.13568 18.8031V10.8745L11.397 3.99429C11.799 3.65478 12.201 3.65478 12.603 3.99429L20.8643 10.8745V18.8031C20.8643 19.4955 20.6633 20.0347 20.2613 20.4208C19.866 20.8069 19.3166 21 18.6131 21H5.39698C4.68677 21 4.13065 20.8069 3.72864 20.4208C3.33333 20.0347 3.13568 19.4955 3.13568 18.8031ZM0.864322 10.6648C0.596315 10.6648 0.38526 10.5849 0.231156 10.4251C0.0770519 10.2587 0 10.0723 0 9.86591C0 9.60628 0.107203 9.38992 0.321608 9.21683L10.794 0.479315C11.1692 0.159772 11.5712 0 12 0C12.4288 0 12.8308 0.159772 13.206 0.479315L23.6784 9.21683C23.8928 9.38992 24 9.60628 24 9.86591C24 10.0723 23.9229 10.2587 23.7688 10.4251C23.6214 10.5849 23.4104 10.6648 23.1357 10.6648C22.995 10.6648 22.8643 10.6315 22.7437 10.5649C22.6298 10.4983 22.5226 10.4251 22.4221 10.3452L12.3518 1.94722C12.2446 1.85402 12.1273 1.80742 12 1.80742C11.8727 1.80742 11.7554 1.85402 11.6482 1.94722L1.58794 10.3452C1.48074 10.4251 1.36683 10.4983 1.24623 10.5649C1.13233 10.6315 1.00503 10.6648 0.864322 10.6648ZM18.5427 5.36234V2.97575C18.5427 2.75606 18.6097 2.58298 18.7437 2.45649C18.8777 2.32335 19.0519 2.25678 19.2663 2.25678H20.3417C20.5628 2.25678 20.737 2.32335 20.8643 2.45649C20.9983 2.58298 21.0653 2.75606 21.0653 2.97575V7.47931L18.5427 5.36234Z" fill="white" />
    </svg>

  )
}
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

  return index >= 0 ? index : 1;
};

const BottomNav = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navItems = [
    { to: "/wallet", icon: WalletIcon, label: t("nav.wallet") },
    { to: "/", icon: HomeIcon, label: t("nav.home"), matchPaths: ["/", "/home"] as string[] },
    { to: "/profile", icon: UserIcon, label: t("nav.profile") },
  ];
  const activeIndex = getActiveIndex(pathname, navItems);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 px-[64px] pt-2"
      style={{
        paddingBottom:
          "max(12px, calc(var(--tg-viewport-safe-area-inset-bottom, 0px) + var(--tg-viewport-content-safe-area-inset-bottom, 0px)))",
      }}
    >
      <div
        className="mx-auto flex h-[62px] w-[248px] items-center justify-around rounded-[37px] p-[1.5px]"
        style={{
          background: "transparent",
        }}
      >
        <div
          className="relative h-full w-full rounded-[35.5px] p-1"
          style={{
            background: "rgba(26, 27, 34, 0.2)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          <div className="pointer-events-none absolute inset-1">
            <div
              className="h-full w-1/3 rounded-[32px] bg-white/12 transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(${activeIndex * 100}%)`,
                boxShadow: "0 0 14px 4px rgba(255,255,255,0.07), inset 0 1px 0 0 rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            />
          </div>
          <div className="relative z-10 grid h-full grid-cols-3">
            {navItems.map(({ to, icon: Icon, label, matchPaths }) => {
              const isActive =
                matchPaths?.includes(pathname) ?? pathname === to;
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={() =>
                    `flex flex-col items-center justify-center gap-0.5 rounded-[32px] transition-colors duration-200 ${isActive ? "text-white" : "text-white/80 hover:text-white"
                    }`
                  }
                >
                  <span className="inline-flex size-6 items-center justify-center text-white [&_svg]:h-6 [&_svg]:w-6">
                    <Icon />
                  </span>
                  <span className="text-[10px] font-medium">{label}</span>
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
