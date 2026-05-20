import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { useBackButton } from "@/hooks/useBackButton";
import PaymentAmount from "./components/PaymentAmount";
import PaymentStatus from "./components/PaymentStatus";
import PaymentDetails from "./components/PaymentDetails";
import { useQrScanner } from "@/hooks/useQrScanner";
import {
  useLumoQrAcceptMutation,
  useLumoQrPrepareMutation,
  useLumoQrStatusQuery,
} from "@/api/lumoHooks";
import { toast } from "@/store/useToastStore";

type Stage = "scanning" | "preparing" | "confirm" | "paying" | "done";

export default function Payment() {
  const { t } = useTranslation();
  useBackButton();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [stage, setStage] = useState<Stage>("scanning");
  const [orderId, setOrderId] = useState<string | null>(null);

  const prepareMutation = useLumoQrPrepareMutation();
  const acceptMutation = useLumoQrAcceptMutation();

  const statusQuery = useLumoQrStatusQuery(orderId, stage === "paying");

  const quote = prepareMutation.data ?? null;
  const initialQrFromLink = searchParams.get("qr")?.trim() ?? "";

  // QR passed from WalletActions "Upload photo" flow
  const uploadedQrCode: string | null =
    (location.state as any)?.qrCode && typeof (location.state as any).qrCode === "string"
      ? (location.state as any).qrCode
      : null;

  const { scan, scanning } = useQrScanner({
    text: "Сканируйте QR-код для оплаты",
  });

  // On first enter: open scanner immediately (if no QR provided via state or link)
  const autoScanOnceRef = useRef(false);

  const expiresAtMs = quote ? new Date(quote.expiresAt).getTime() : null;
  const isQuoteExpired = expiresAtMs != null ? Date.now() > expiresAtMs : false;

  const exchangeRateText = useMemo(() => {
    if (!quote) return "—";
    return `1$ = ${quote.userRate.toFixed(2)}₽`;
  }, [quote]);

  useEffect(() => {
    if (!statusQuery.data?.isFinal) return;

    if (statusQuery.data.status === "success") {
      setStage("done");
      toast.success(t("payment.statusDoneTitle"));
      return;
    }

    // Любой другой финальный статус
    setStage("scanning");
    setOrderId(null);
    prepareMutation.reset();
    toast.error(`Платёж: ${statusQuery.data.status}`);
  }, [prepareMutation, statusQuery.data?.isFinal, statusQuery.data?.status, t]);

  async function handlePrepareFromQr(qrCode: string) {
    setStage("preparing");
    try {
      const res = await prepareMutation.mutateAsync({ qrCode });
      setOrderId(res.orderId);
      setStage("confirm");
    } catch {
      setStage("scanning");
      toast.error("Не удалось подготовить платёж. Попробуйте ещё раз.");
    }
  }

  async function handleScanAndPrepare() {
    setStage("scanning");

    const qr = await scan();
    if (!qr) {
      // user cancelled scanner — stay on screen with manual button
      setStage("scanning");
      return;
    }

    await handlePrepareFromQr(qr);
  }

  // Auto start on page open
  useEffect(() => {
    if (autoScanOnceRef.current) return;
    if (quote) return;

    autoScanOnceRef.current = true;

    if (uploadedQrCode) {
      void handlePrepareFromQr(uploadedQrCode);
      return;
    }

    // If QR is provided via link, another effect will handle it.
    if (initialQrFromLink) return;

    void handleScanAndPrepare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote, uploadedQrCode, initialQrFromLink]);

  // Auto prepare from link (?qr=...)
  const autoPrepareFromLinkRef = useRef(false);
  useEffect(() => {
    if (!initialQrFromLink) return;
    if (autoPrepareFromLinkRef.current) return;
    autoPrepareFromLinkRef.current = true;
    void handlePrepareFromQr(initialQrFromLink);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQrFromLink]);

  const canPay = !!quote && !isQuoteExpired && !acceptMutation.isPending;

  async function handleAccept() {
    if (!orderId) return;

    try {
      setStage("paying");
      await acceptMutation.mutateAsync({ orderId });
      // дальше статус будет поллиться через useLumoQrStatusQuery
    } catch (e: any) {
      setStage("confirm");
      if (e?.code === "INSUFFICIENT_BALANCE") {
        const a = e?.details?.available;
        const r = e?.details?.required;
        toast.error(
          `Недостаточно средств. Доступно: ${a ?? "—"}, требуется: ${r ?? "—"}`
        );
        return;
      }
      toast.error("Не удалось подтвердить платёж. Попробуйте ещё раз.");
    }
  }

  const merchantName =
    (quote as any)?.merchantName ?? (quote as any)?.merchant ?? "-";

  return (
    <div
      className="min-h-screen flex flex-col text-white"
      style={{
        background:
          stage === "done"
            ? "linear-gradient(to bottom, #113e36 0%, #0c2427 25%, #080d1a 50%)"
            : "linear-gradient(to bottom, #0A204F 0%, #0A1531 8%, #080C18 30%)",
        paddingTop:
          "calc(var(--tg-viewport-safe-area-inset-top, 0px) + var(--tg-viewport-content-safe-area-inset-top, 0px) + 1rem)",
        paddingBottom:
          "calc(var(--tg-viewport-safe-area-inset-bottom, 0px) + var(--tg-viewport-content-safe-area-inset-bottom, 0px) + 1rem)",
        paddingInline: "1rem",
      }}
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center">
          <PaymentAmount
            amount={quote?.amountRub ?? 0}
            currency="RUB"
            equivalent={quote ? `${quote.userAmountUsdt.toFixed(2)} USDT` : "—"}
          />
        </div>

        <div className="mt-auto space-y-3 pb-1">
          <PaymentStatus stage={stage} />

          {/* Детали + подтверждение показываем только после ответа prepare */}
          {quote && (
            <>
              <PaymentDetails exchangeRate={exchangeRateText} merchantName={merchantName} />

              {stage === "confirm" && (
                <button
                  type="button"
                  onClick={isQuoteExpired ? handleScanAndPrepare : handleAccept}
                  className="w-full rounded-2xl bg-white py-3.5 text-sm font-semibold text-[#080C18] transition-colors active:bg-white/90 disabled:opacity-60"
                  disabled={!isQuoteExpired && !canPay}
                >
                  {isQuoteExpired ? "Время истекло — сканируйте заново" : t("payment.pay")}
                </button>
              )}
            </>
          )}

          {/* Если авто-скан отменили/не сработало — ручной запуск сканера */}
          {stage === "scanning" && !quote && (
            <button
              type="button"
              onClick={handleScanAndPrepare}
              className="w-full rounded-2xl bg-white py-3.5 text-sm font-semibold text-[#080C18] transition-colors active:bg-white/90"
              disabled={scanning || prepareMutation.isPending}
            >
              {scanning || prepareMutation.isPending
                ? t("common.loadingEllipsis")
                : "Сканировать QR"}
            </button>
          )}

          {/* Ожидаем финал */}
          {stage === "paying" && (
            <button
              type="button"
              disabled
              className="w-full rounded-2xl bg-white/10 py-3.5 text-sm font-semibold text-white ring-1 ring-white/10 transition-colors"
            >
              {t("payment.continue")}
            </button>
          )}

          {stage === "done" && (
            <button
              type="button"
              onClick={() => navigate("/wallet")}
              className="w-full rounded-2xl bg-white py-3.5 text-sm font-semibold text-[#080C18] transition-colors active:bg-white/90"
            >
              {t("payment.toHome")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
