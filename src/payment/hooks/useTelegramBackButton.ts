import { useEffect } from "react";
import { useNavigate } from "react-router";

interface TelegramBackButton {
  show?: () => void;
  hide?: () => void;
  onClick?: (handler: () => void) => void;
  offClick?: (handler: () => void) => void;
}

interface TelegramWebApp {
  BackButton?: TelegramBackButton;
}

interface TelegramWindow extends Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
  __telegramPopupBackButtonCount?: number;
  __telegramRouteBackButtonCount?: number;
}

function incrementRouteBackButtonCount(telegramWindow: TelegramWindow): number {
  const nextCount = (telegramWindow.__telegramRouteBackButtonCount ?? 0) + 1;
  telegramWindow.__telegramRouteBackButtonCount = nextCount;
  return nextCount;
}

function decrementRouteBackButtonCount(telegramWindow: TelegramWindow): number {
  const nextCount = Math.max(
    0,
    (telegramWindow.__telegramRouteBackButtonCount ?? 1) - 1
  );
  telegramWindow.__telegramRouteBackButtonCount = nextCount;
  return nextCount;
}

type TelegramBackButtonOptions = {
  onClick?: () => void;
  replace?: boolean;
};

export function useTelegramBackButton(
  pathToGoBack = "/",
  options: TelegramBackButtonOptions = {}
) {
  const navigate = useNavigate();
  const { onClick, replace = false } = options;

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const telegramWindow = window as TelegramWindow;
    const webApp = telegramWindow.Telegram?.WebApp;
    const backButton = webApp?.BackButton;

    if (!backButton) {
      return undefined;
    }

    const handler = () => {
      if ((telegramWindow.__telegramPopupBackButtonCount ?? 0) > 0) {
        return;
      }
      onClick?.();
      navigate(pathToGoBack, { replace });
    };

    incrementRouteBackButtonCount(telegramWindow);

    try {
      backButton.show?.();
      backButton.onClick?.(handler);
    } catch (error) {
      console.warn("Unable to configure Telegram BackButton", error);
    }

    return () => {
      try {
        backButton.offClick?.(handler);
        const routeBackButtonsCount = decrementRouteBackButtonCount(telegramWindow);
        const popupBackButtonsCount = telegramWindow.__telegramPopupBackButtonCount ?? 0;
        if (routeBackButtonsCount === 0 && popupBackButtonsCount === 0) {
          backButton.hide?.();
        }
      } catch (error) {
        console.warn("Unable to detach Telegram BackButton", error);
      }
    };
  }, [navigate, onClick, pathToGoBack, replace]);
}
