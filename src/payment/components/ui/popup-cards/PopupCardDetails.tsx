/* eslint-disable react-hooks/set-state-in-effect */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import CopyIcon from "../../../assets/svg/copy";
import CopiedIcon from "../../../assets/svg/copied";
import VisaIcon from "../../../assets/svg/visa";
import { useBodyScrollLock } from "../../../hooks/useBodyScrollLock";
import { useTelegramPopupBackButton } from "../../../hooks/useTelegramPopupBackButton";
import { useI18n } from "../../../i18n";

interface PopupCardDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  cardNumber: string;
  expiry: string;
  cvv: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
}

type CopyFieldId =
  | "number"
  | "expiry"
  | "cvv"
  | "country"
  | "city"
  | "address"
  | "postalCode";

async function copyTextValue(value: string) {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return false;
  }

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(normalizedValue);
      return true;
    }
  } catch {
    // Fallback below.
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = normalizedValue;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();

  let didCopy = false;
  try {
    didCopy = document.execCommand("copy");
  } catch {
    didCopy = false;
  } finally {
    document.body.removeChild(textarea);
  }

  return didCopy;
}

function CardCopyButton({
  isCopied,
  onClick,
  size,
  className = "",
}: {
  isCopied: boolean;
  onClick: () => void;
  size: number;
  className?: string;
}) {
  const { t } = useI18n();

  return (
    <button
      type="button"
      className={`popupCardDetailsCopyBtn${
        isCopied ? " popupCardDetailsCopyBtn--copied" : ""
      }${className ? ` ${className}` : ""}`}
      onClick={onClick}
      aria-label={isCopied ? t("common.copied") : t("common.copy")}
    >
      <span className="popupCardDetailsCopyBtnIcon">
        <CopyIcon size={size} color="white" />
      </span>
      <span className="popupCardDetailsCopyBtnIconCopied">
        <CopiedIcon size={size} color="white" />
      </span>
    </button>
  );
}

export default function PopupCardDetails({
  isOpen,
  onClose,
  cardNumber,
  expiry,
  cvv,
  country,
  city,
  address,
  postalCode,
}: PopupCardDetailsProps) {
  const { t } = useI18n();
  const [copiedFieldId, setCopiedFieldId] = useState<CopyFieldId | null>(null);

  useTelegramPopupBackButton(isOpen, onClose);
  useBodyScrollLock(isOpen);

  const addressRows = useMemo(
    () => [
      { id: "country", label: t("cards.details.country"), value: country },
      { id: "city", label: t("cards.details.city"), value: city },
      { id: "address", label: t("cards.details.address"), value: address },
      {
        id: "postalCode",
        label: t("cards.details.postalCode"),
        value: postalCode,
      },
    ] satisfies Array<{ id: CopyFieldId; label: string; value: string }>,
    [address, city, country, postalCode, t],
  );

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

  const handleCopyValue = useCallback(async (fieldId: CopyFieldId, value: string) => {
    const copied = await copyTextValue(value);
    if (!copied) {
      return;
    }

    setCopiedFieldId(fieldId);
    window.setTimeout(() => {
      setCopiedFieldId((currentFieldId) =>
        currentFieldId === fieldId ? null : currentFieldId,
      );
    }, 1400);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setCopiedFieldId(null);
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
            onPointerDown={onClose}
            onClick={onClose}
          />
          <motion.div className="popupPurchaseContainer">
            <motion.div
              className="popupPurchaseSheet popupEsimSheet popupEsimSheet--confirm popupCardDetailsSheet"
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
              aria-label={t("cards.details.title")}
            >
              <div className="popupPurchaseHandleArea">
                <span className="popupPurchaseHandle" aria-hidden />
              </div>

              <div className="popupEsimContent popupEsimContent--confirm popupCardDetailsContent">
                <div className="popupCardDetailsLayout">
                  <div className="popupCardDetailsPreview" aria-hidden="true">
                    <div className="popupCardDetailsPreviewHead">
                      <span className="popupCardDetailsPreviewVisa">
                        <VisaIcon />
                      </span>
                    </div>

                    <div className="popupCardDetailsPreviewBottom">
                      <div className="popupCardDetailsPreviewValues">
                        <div className="popupCardDetailsValueChip">
                          <button
                            type="button"
                            className="popupCardDetailsValueChipText popupCardDetailsValueTextBtn"
                            onClick={() => void handleCopyValue("number", cardNumber)}
                          >
                            {cardNumber}
                          </button>
                          <CardCopyButton
                            isCopied={copiedFieldId === "number"}
                            onClick={() => void handleCopyValue("number", cardNumber)}
                            size={17}
                            className="popupCardDetailsValueChipCopy"
                          />
                        </div>

                        <div className="popupCardDetailsPreviewMeta">
                          <div className="popupCardDetailsValueChip popupCardDetailsValueChip--small">
                            <button
                              type="button"
                              className="popupCardDetailsValueChipText popupCardDetailsValueTextBtn"
                              onClick={() => void handleCopyValue("expiry", expiry)}
                            >
                              {expiry}
                            </button>
                            <CardCopyButton
                              isCopied={copiedFieldId === "expiry"}
                              onClick={() => void handleCopyValue("expiry", expiry)}
                              size={17}
                              className="popupCardDetailsValueChipCopy"
                            />
                          </div>

                          <div className="popupCardDetailsValueChip popupCardDetailsValueChip--small">
                            <button
                              type="button"
                              className="popupCardDetailsValueChipText popupCardDetailsValueTextBtn"
                              onClick={() => void handleCopyValue("cvv", cvv)}
                            >
                              {cvv}
                            </button>
                            <CardCopyButton
                              isCopied={copiedFieldId === "cvv"}
                              onClick={() => void handleCopyValue("cvv", cvv)}
                              size={17}
                              className="popupCardDetailsValueChipCopy"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="newCardDetailsBlock popupCardDetailsAddressBlock">
                    {addressRows.map((row) => (
                      <div className="newCardDetailsRow" key={row.id}>
                        <span className="newCardDetailsLabel">{row.label}</span>
                        <span className="popupCardDetailsAddressValue">
                          <button
                            type="button"
                            className="newCardDetailsValue popupCardDetailsAddressValueTextBtn"
                            onClick={() => void handleCopyValue(row.id, row.value)}
                          >
                            {row.value}
                          </button>
                          <CardCopyButton
                            isCopied={copiedFieldId === row.id}
                            onClick={() => void handleCopyValue(row.id, row.value)}
                            size={15}
                            className="popupCardDetailsAddressCopy"
                          />
                        </span>
                      </div>
                    ))}
                  </div>
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
