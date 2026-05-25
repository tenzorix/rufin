import { useEffect, useRef } from "react";

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

function incrementPopupBackButtonCount(telegramWindow: TelegramWindow): number {
  const nextCount = (telegramWindow.__telegramPopupBackButtonCount ?? 0) + 1;
  telegramWindow.__telegramPopupBackButtonCount = nextCount;
  return nextCount;
}

function decrementPopupBackButtonCount(telegramWindow: TelegramWindow): number {
  const nextCount = Math.max(
    0,
    (telegramWindow.__telegramPopupBackButtonCount ?? 1) - 1
  );
  telegramWindow.__telegramPopupBackButtonCount = nextCount;
  return nextCount;
}

export function useTelegramPopupBackButton(
  isOpen: boolean,
  onClose: () => void
) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") {
      return undefined;
    }

    const telegramWindow = window as TelegramWindow;
    const backButton = telegramWindow.Telegram?.WebApp?.BackButton;
    if (!backButton) {
      return undefined;
    }

    const handleBackClick = () => {
      onCloseRef.current();
    };

    incrementPopupBackButtonCount(telegramWindow);

    try {
      backButton.show?.();
      backButton.onClick?.(handleBackClick);
    } catch (error) {
      console.warn("Unable to configure Telegram popup BackButton", error);
    }

    return () => {
      try {
        backButton.offClick?.(handleBackClick);
        const openedPopupsCount = decrementPopupBackButtonCount(telegramWindow);
        const routeBackButtonsCount =
          telegramWindow.__telegramRouteBackButtonCount ?? 0;
        if (openedPopupsCount === 0 && routeBackButtonsCount === 0) {
          backButton.hide?.();
        }
      } catch (error) {
        console.warn("Unable to detach Telegram popup BackButton", error);
      }
    };
  }, [isOpen]);
}
