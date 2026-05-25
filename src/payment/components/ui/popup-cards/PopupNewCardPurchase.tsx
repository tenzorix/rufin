import {
  useCallback,
  useEffect,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";
import { useTelegramPopupBackButton } from "../../../hooks/useTelegramPopupBackButton";
import { useI18n } from "../../../i18n";

interface PopupNewCardPurchaseProps {
  isOpen: boolean;
  onClose: () => void;
  openingFeeUsdt: number;
  initialDepositUsd: number;
  initialDepositFeeUsdt: number;
  totalChargeUsdt: number;
  isSubmitting: boolean;
  onConfirm: () => void | Promise<void>;
}

function formatAmount(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function formatCurrencyAmount(value: number): string {
  return value.toFixed(2);
}

export default function PopupNewCardPurchase({
  isOpen,
  onClose,
  openingFeeUsdt,
  initialDepositUsd,
  initialDepositFeeUsdt,
  totalChargeUsdt,
  isSubmitting,
  onConfirm,
}: PopupNewCardPurchaseProps) {
  const { t } = useI18n();

  useTelegramPopupBackButton(isOpen, onClose);
  useBodyScrollLock(isOpen);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 120 || info.velocity.y > 700) {
        onClose();
      }
    },
    [onClose],
  );

  const handleSheetKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            className="popupPurchaseOverlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />
          <motion.div className="popupPurchaseContainer">
            <motion.div
              className="popupPurchaseSheet popupEsimSheet popupEsimSheet--confirm popupCardPurchaseSheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 280,
                mass: 0.9,
              }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.24 }}
              onDragEnd={handleDragEnd}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={handleSheetKeyDown}
              role="dialog"
              aria-modal="true"
              aria-label={t("cards.purchase.title")}
            >
              <div className="popupPurchaseHandleArea">
                <span className="popupPurchaseHandle" aria-hidden />
              </div>

              <div className="popupEsimContent popupEsimContent--confirm popupCardPurchaseContent">
                <div className="popupEsimConfirmLayout popupCardPurchaseConfirmLayout">
                  <div className="popupEsimConfirmTop">
                    <div className="popupCardPurchaseSummary">
                      <div className="popupEsimConfirmHeading">
                        <h2 className="popupEsimConfirmTitle">
                          {t("cards.purchase.title")}
                        </h2>
                      </div>

                      <div className="popupEsimConfirmAmount">
                        <span className="popupEsimConfirmAmountText popupEsimConfirmAmountValue">
                          {formatAmount(totalChargeUsdt)}
                        </span>
                        <span className="popupEsimConfirmAmountText popupEsimConfirmAmountCurrency">
                          {t("cards.purchase.amountCurrency")}
                        </span>
                      </div>
                    </div>

                    <div className="popupCardPurchaseDetails newCardDetailsBlock">
                      <div className="popupCardPurchaseDetailsRow newCardDetailsRow">
                        <span className="popupCardPurchaseDetailsLabel newCardDetailsLabel">
                          {t("cards.new.pricing.issue.label")}
                        </span>
                        <span className="popupCardPurchaseDetailsValue newCardDetailsValue">
                          ${formatAmount(openingFeeUsdt)}
                        </span>
                      </div>
                      <div className="popupCardPurchaseDetailsRow newCardDetailsRow">
                        <span className="popupCardPurchaseDetailsLabel newCardDetailsLabel">
                          {t("cards.new.pricing.deposit.label")}
                        </span>
                        <span className="popupCardPurchaseDetailsValue newCardDetailsValue">
                          ${formatAmount(initialDepositUsd)}
                        </span>
                      </div>
                    </div>

                    {initialDepositFeeUsdt > 0 ? (
                      <div className="popupCardPurchaseDetails popupCardPurchaseDetails--fee newCardDetailsBlock">
                        <div className="popupCardPurchaseDetailsRow newCardDetailsRow">
                          <span className="popupCardPurchaseDetailsLabel newCardDetailsLabel">
                            {t("cards.purchase.firstTopUpFeeLabel")}
                          </span>
                          <span className="popupCardPurchaseDetailsValue newCardDetailsValue">
                            ${formatCurrencyAmount(initialDepositFeeUsdt)}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className={`popupPurchaseDisputeBtn popupPurchaseDisputeBtn--static popupEsimBuyButton popupEsimConfirmButton popupVpnBuyButton${
                      !isSubmitting ? " popupCardPurchaseSubmitBtn--valid" : ""
                    }`}
                    onClick={() => void onConfirm()}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? t("cards.purchase.submitting")
                      : t("cards.purchase.confirm")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
