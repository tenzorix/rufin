import { useLayoutEffect, useRef } from "react";
import BottomNav from "@/components/shared/BottomNav";
import { Outlet, useLocation } from "react-router";
import { useTgFullscreenMobile } from "@/hooks/useTgFullscreenMobile";
import { useBottomNavStore } from "@/store/useBottomNavStore";

type LayoutProps = {
  showBottomNav?: boolean;
}
const Layout = ({ showBottomNav = true }: LayoutProps) => {
  const mainRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();
  const tgFullscreenMobile = useTgFullscreenMobile();
  const isBottomNavVisible = useBottomNavStore((s) => s.hiddenLocks === 0);
  const shouldShowBottomNav = showBottomNav && isBottomNavVisible;

  useLayoutEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  const paddingTop = tgFullscreenMobile
    ? "calc(max(env(safe-area-inset-top, 0px), var(--tg-viewport-safe-area-inset-top, 0px)) + 1.5rem)"
    : "calc(var(--tg-viewport-safe-area-inset-top, 0px) + var(--tg-viewport-content-safe-area-inset-top, 0px))";

  return (
    <div className="flex flex-col h-screen text-white overflow-hidden bg-[linear-gradient(to_bottom,#0A204F_0%,#0A1531_8%,#080C18_30%)]">
      <main
        ref={mainRef}
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop,
          paddingBottom: shouldShowBottomNav
            ? "calc(5rem + var(--tg-viewport-safe-area-inset-bottom, 0px) + var(--tg-viewport-content-safe-area-inset-bottom, 0px))"
            : undefined,
        }}
      >
        <Outlet />
      </main>
      {shouldShowBottomNav && <BottomNav />}
    </div>
  );
};

export default Layout