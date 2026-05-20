import { useLayoutEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router";
import { useTgFullscreenMobile } from "@/hooks/useTgFullscreenMobile";

function SecondaryLayout() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { pathname } = useLocation();
    const tgFullscreenMobile = useTgFullscreenMobile();

    useLayoutEffect(() => {
        scrollRef.current?.scrollTo(0, 0);
    }, [pathname]);

    const paddingTop = tgFullscreenMobile
        ? "calc(max(env(safe-area-inset-top, 0px), var(--tg-viewport-safe-area-inset-top, 0px)) + 3rem)"
        : "calc(var(--tg-viewport-safe-area-inset-top, 0px) + var(--tg-viewport-content-safe-area-inset-top, 0px) + 1rem)";

    return (
        <div
            ref={scrollRef}
            className="min-h-screen flex flex-col bg-[#080c19] px-4 pb-4 text-white overflow-y-auto"
            style={{ paddingTop }}
        >
            <Outlet />
        </div>
    );
}
export default SecondaryLayout;