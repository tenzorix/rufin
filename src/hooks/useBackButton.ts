import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { backButton } from "@telegram-apps/sdk";

export function useBackButton(onBack?: () => void) {
  const navigate = useNavigate();
  const onBackRef = useRef(onBack);
  useEffect(() => {
    if (!backButton.isMounted()) return;

    backButton.show();

    const removeListener = backButton.onClick(() => {
      if (onBackRef.current) {
        onBackRef.current();
      } else {
        navigate(-1);
      }
    });

    return () => {
      removeListener();
      backButton.hide();
    };
  }, [navigate]);
}
