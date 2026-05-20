import { useEffect } from "react";
import AppToast from "@/components/shared/AppToast";
import Router from "./router";
import { preloadDepositQR } from "@/components/common/qrCodeCache";
import { DEPOSIT_QR_ADDRESS, DEPOSIT_QR_LOGO, DEPOSIT_QR_LOGO_IMAGE_SIZE } from "@/constants/deposit";
import { useProfileQuery } from "@/api/hooks";
import { telegramBotDeepLink } from "@/constants/env";

export default function App() {
  const { data: profile } = useProfileQuery();
  const referralCode = profile?.referal_code;

  useEffect(() => {
    preloadDepositQR(DEPOSIT_QR_ADDRESS, DEPOSIT_QR_LOGO, 240, 2, DEPOSIT_QR_LOGO_IMAGE_SIZE);
  }, []);

  useEffect(() => {
    if (!referralCode) return;
    preloadDepositQR(telegramBotDeepLink(`ref_${referralCode}`), "/icons/rufin.png", 200);
  }, [referralCode]);

  return (
    <>
      <Router />
      <AppToast />
    </>
  );
}
