import { miniApp } from "@telegram-apps/sdk-react";
import { toast } from "@/store/useToastStore";
import i18n from "@/i18n";

export type CheckoutFormValues = {
  firstName: string;
  lastName: string;
  middleName: string | null;
  usdtAddress: string | null;
};

export type CheckoutValidationResult =
  | { ok: true; values: CheckoutFormValues }
  | { ok: false; nameError?: string; usdtError?: string };

export function parseFullname(fullname: string | undefined): { lastName: string; firstName: string; middleName: string } {
  const parts = (fullname || "").trim().split(/\s+/).filter(Boolean);
  return {
    lastName: parts[0] || "",
    firstName: parts[1] || "",
    middleName: parts.length >= 3 ? parts.slice(2).join(" ") : "",
  };
}

export function validateCheckoutForm(
  values: CheckoutFormValues,
  options?: { internalWalletAddress?: string; requireUsdt?: boolean }
): CheckoutValidationResult {
  const requireUsdt = options?.requireUsdt !== false;
  const nameRegex = /^[А-ЯЁа-яёA-Za-z\s-]+$/u;
  const trc20Regex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

  if (!values.firstName || !values.lastName) {
    return { ok: false, nameError: i18n.t("validation.fillName") };
  }

  if (!nameRegex.test(values.firstName) || !nameRegex.test(values.lastName) || (values.middleName && !nameRegex.test(values.middleName))) {
    return { ok: false, nameError: i18n.t("validation.nameChars") };
  }

  if (!requireUsdt) {
    return { ok: true, values: { ...values, usdtAddress: null } };
  }

  if (!values.usdtAddress) {
    return { ok: false, usdtError: i18n.t("validation.usdtRequired") };
  }

  const isInternalWallet =
    !!options?.internalWalletAddress && values.usdtAddress === options.internalWalletAddress;
  if (!isInternalWallet && !trc20Regex.test(values.usdtAddress)) {
    return { ok: false, usdtError: i18n.t("validation.usdtInvalid") };
  }

  return { ok: true, values };
}

export function handleCheckoutSuccess(
  navigate: (to: string) => void,
  clearDraft: () => void,
  options?: { toastMessage?: string }
) {
  toast.success(options?.toastMessage ?? i18n.t("validation.orderCreated"));

  setTimeout(() => {
    if (miniApp.close.isAvailable()) {
      miniApp.close();
    }
  }, 1200);

  setTimeout(() => {
    navigate("/");
    clearDraft();
  }, 2500);
}
