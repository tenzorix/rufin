import { useMemo, useState } from "react";
import { toast } from "@/store/useToastStore";
import { useNavigate } from "react-router";
import { useCardsCatalog } from "../../hooks/useCards";
import { useI18n } from "../../i18n";
import PopupNewCardPurchase from "../ui/popup-cards/PopupNewCardPurchase";

function formatPlainAmount(value: number, suffix = ""): string {
  const formatted = value.toFixed(2).replace(/\.?0+$/, "");
  return suffix ? `${formatted} ${suffix}` : formatted;
}

export default function NewCard() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { me, activeCards, loading, error, refresh, requestNewCard, isRequestingCard } =
    useCardsCatalog();
  const [isPurchasePopupOpen, setIsPurchasePopupOpen] = useState(false);

  const commissionPercent = me?.commissionPercent ?? 3;
  const openingFeeUsdt = me?.openingFeeUsdt ?? 25;
  const initialDepositUsd = me?.minInitialDepositUsd ?? 25;
  const initialDepositFeeUsdt =
    (initialDepositUsd * commissionPercent) / 100;
  const totalChargeUsdt = openingFeeUsdt + initialDepositUsd;
  const canCreateMoreCards = me
    ? activeCards.length < me.maxCardsPerUser
    : true;
  const canOpenPurchase = Boolean(me) && canCreateMoreCards && !loading;

  const primaryDetails = useMemo(
    () => [
      {
        label: t("cards.new.details.topupFee.label"),
        value: `${commissionPercent}%`,
      },
      {
        label: t("cards.new.details.billingAddress.label"),
        value: t("cards.new.details.billingAddress.value"),
      },
      {
        label: t("cards.new.details.validity.label"),
        value: t("cards.new.details.validity.value"),
      },
      {
        label: t("cards.new.details.currency.label"),
        value: t("cards.new.details.currency.value"),
      },
    ],
    [commissionPercent, t],
  );

  const pricingDetails = useMemo(
    () => [
      {
        label: t("cards.new.pricing.issue.label"),
        value: `$${formatPlainAmount(openingFeeUsdt)}`,
      },
      {
        label: t("cards.new.pricing.deposit.label"),
        value: `$${formatPlainAmount(initialDepositUsd)}`,
      },
    ],
    [initialDepositUsd, openingFeeUsdt, t],
  );

  const handleConfirmPurchase = async () => {
    try {
      await requestNewCard();
      setIsPurchasePopupOpen(false);
      navigate("/card", { replace: true });
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : t("cards.error.unavailable");
      toast.error(message);
    }
  };

  return (
    <>
      <div className="paymentsContainer cardsContainer newCardContainer">
        <section
          className="paymentsBlock cardsBlock newCardBlock"
          aria-label={t("cards.new.page.aria")}
        >
          {error ? (
            <div className="historyState historyState--error cardsPageState">
              <span>{error}</span>
              <button type="button" className="historyStateBtn" onClick={refresh}>
                {t("history.retry")}
              </button>
            </div>
          ) : null}

          <div className="newCardHero">
            <div className="newCardPreview" aria-hidden="true" />

            <p className="newCardHeroTitle">{t("cards.new.title")}</p>
          </div>

          <div className="newCardDetails">
            <div className="newCardDetailsBlock">
              {primaryDetails.map((row) => (
                <div className="newCardDetailsRow" key={row.label}>
                  <span className="newCardDetailsLabel">{row.label}</span>
                  <span className="newCardDetailsValue">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="newCardDetailsBlock">
              {pricingDetails.map((row) => (
                <div className="newCardDetailsRow" key={row.label}>
                  <span className="newCardDetailsLabel">{row.label}</span>
                  <span className="newCardDetailsValue">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {!canCreateMoreCards && me ? (
            <div className="historyState cardsPageState">
              {t("cards.maxReached").replace(
                "{count}",
                String(me.maxCardsPerUser),
              )}
            </div>
          ) : null}

          <div className="newCardFooter">
            <button
              type="button"
              className={`popupPurchaseDisputeBtn popupPurchaseDisputeBtn--static newCardSubmitBtn${
                canOpenPurchase && !isRequestingCard
                  ? " newCardSubmitBtn--valid"
                  : ""
              }`}
              onClick={() => setIsPurchasePopupOpen(true)}
              disabled={!canOpenPurchase || isRequestingCard}
            >
              {isRequestingCard ? t("cards.purchase.submitting") : t("cards.new.submit")}
            </button>
          </div>
        </section>
      </div>

      <PopupNewCardPurchase
        isOpen={isPurchasePopupOpen}
        onClose={() => setIsPurchasePopupOpen(false)}
        openingFeeUsdt={openingFeeUsdt}
        initialDepositUsd={initialDepositUsd}
        initialDepositFeeUsdt={initialDepositFeeUsdt}
        totalChargeUsdt={totalChargeUsdt}
        isSubmitting={isRequestingCard}
        onConfirm={handleConfirmPurchase}
      />
    </>
  );
}
