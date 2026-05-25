/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import CredentialsIcon from "../../../assets/icons/CredentialsIcon";
import DepositIcon from "../../../assets/icons/DepositIcon";
import {
  fetchCardSensitive,
  type CardSensitive,
} from "../../api/cards";
import {
  useCardActivity,
  useCardsCatalog,
  formatCardBalance,
  formatCardMaskedSuffix,
} from "../../hooks/useCards";
import { useI18n } from "../../i18n";
import History from "../history/History";
import PopupCardDetails from "../ui/popup-cards/PopupCardDetails";

const CARD_HISTORY_SWITCH_DELAY_MS = 220;
const CARD_SENSITIVE_VISIBLE_MS = 30_000;

export default function Card() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const {
    loading,
    error,
    activeCards,
    refresh,
  } = useCardsCatalog();
  const [isCardDetailsOpen, setIsCardDetailsOpen] = useState(false);
  const [isCardHistoryLoading, setIsCardHistoryLoading] = useState(true);
  const [sensitiveByCardId, setSensitiveByCardId] = useState<
    Record<string, CardSensitive>
  >({});
  const sensitiveHideTimeoutRef = useRef<number | null>(null);
  const sensitiveRequestsRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (!loading && activeCards.length === 0) {
      navigate("/cards", { replace: true });
    }
  }, [activeCards.length, loading, navigate]);

  const selectedCard = activeCards[0] ?? null;

  const {
    cardId: activityCardId,
    history,
    balanceUsd,
    loading: activityLoading,
    error: activityError,
    refresh: refreshActivity,
  } = useCardActivity(selectedCard);

  const selectedSensitiveDetails = selectedCard
    ? sensitiveByCardId[selectedCard.id] ?? null
    : null;
  const isInitialLoading = loading && !selectedCard;
  const isActivityStale =
    selectedCard?.status === "assigned" &&
    selectedCard.id !== activityCardId;

  const clearSensitiveHideTimeout = useCallback(() => {
    if (sensitiveHideTimeoutRef.current !== null) {
      window.clearTimeout(sensitiveHideTimeoutRef.current);
      sensitiveHideTimeoutRef.current = null;
    }
  }, []);

  const clearSensitiveForCard = useCallback((cardId: string) => {
    setSensitiveByCardId((previousDetails) => {
      if (!previousDetails[cardId]) {
        return previousDetails;
      }

      const nextDetails = { ...previousDetails };
      delete nextDetails[cardId];
      return nextDetails;
    });
  }, []);

  const closeCardDetails = useCallback(() => {
    clearSensitiveHideTimeout();
    if (selectedCard?.id) {
      clearSensitiveForCard(selectedCard.id);
    }
    setIsCardDetailsOpen(false);
  }, [clearSensitiveForCard, clearSensitiveHideTimeout, selectedCard?.id]);

  const loadCardSensitive = useCallback(
    (cardId: string) => {
      if (sensitiveByCardId[cardId] || sensitiveRequestsRef.current.has(cardId)) {
        return;
      }

      sensitiveRequestsRef.current.add(cardId);

      void fetchCardSensitive(cardId)
        .then((details) => {
          if (!isMountedRef.current) {
            return;
          }

          setSensitiveByCardId((previousDetails) => {
            if (previousDetails[cardId]) {
              return previousDetails;
            }

            return {
              ...previousDetails,
              [cardId]: details,
            };
          });
        })
        .catch(() => {
          // Details popup keeps masked/fallback values if sensitive data is unavailable.
        })
        .finally(() => {
          sensitiveRequestsRef.current.delete(cardId);
        });
    },
    [sensitiveByCardId],
  );

  useEffect(() => {
    clearSensitiveHideTimeout();

    if (!isCardDetailsOpen || selectedCard?.status !== "assigned") {
      if (!isCardDetailsOpen && selectedCard?.id) {
        clearSensitiveForCard(selectedCard.id);
      }
      return;
    }

    const cardId = selectedCard.id;
    loadCardSensitive(cardId);
    sensitiveHideTimeoutRef.current = window.setTimeout(() => {
      clearSensitiveForCard(cardId);
      sensitiveHideTimeoutRef.current = null;
    }, CARD_SENSITIVE_VISIBLE_MS);

    return clearSensitiveHideTimeout;
  }, [
    clearSensitiveForCard,
    clearSensitiveHideTimeout,
    isCardDetailsOpen,
    loadCardSensitive,
    selectedCard?.id,
    selectedCard?.status,
  ]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      clearSensitiveHideTimeout();
    };
  }, [clearSensitiveHideTimeout]);

  useEffect(() => {
    if (!selectedCard?.id) {
      return;
    }

    setIsCardHistoryLoading(true);

    const timeoutId = window.setTimeout(() => {
      setIsCardHistoryLoading(false);
    }, CARD_HISTORY_SWITCH_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [selectedCard?.id]);

  const balanceParts = formatCardBalance(balanceUsd);
  const isAssignedCard = selectedCard?.status === "assigned";
  const canTopUp = Boolean(
    selectedCard && selectedCard.status === "assigned",
  );
  const visibleHistory = isActivityStale ? [] : history;
  const visibleActivityError = isActivityStale ? null : activityError;
  const hasHistory = visibleHistory.length > 0;
  const showHistory =
    isAssignedCard &&
    (activityLoading || isActivityStale || Boolean(visibleActivityError) || hasHistory);
  const isBalanceLoading =
    isInitialLoading ||
    Boolean(
      selectedCard?.status === "assigned" &&
        (activityLoading || isActivityStale) &&
        !hasHistory &&
        balanceUsd === 0,
    );

  if (!selectedCard && !isInitialLoading) {
    return (
      <div className="paymentsContainer cardsContainer cardPageContainer">
        <section className="paymentsBlock cardsBlock cardPageBlock">
          <div className="historyState historyState--error cardsPageState">
            <span>{error || t("cards.error.unavailable")}</span>
            <button type="button" className="historyStateBtn" onClick={refresh}>
              {t("history.retry")}
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      <div className="paymentsContainer cardsContainer cardPageContainer">
        <section
          className="paymentsBlock cardsBlock cardPageBlock"
          aria-label={t("cards.cardPage.aria")}
        >
          <div className="cardPageSliderWrap">
            <div className="cardPageSlider">
              {isInitialLoading ? (
                <div
                  className="cardPageSlide cardPageSlide--skeleton skeletonShimmer"
                  aria-hidden="true"
                  data-card-id="loading-card"
                />
              ) : selectedCard ? (
                <button
                  type="button"
                  className="cardPageSlide popupEsimCardsSlideButton cardPageSlide--selected"
                  onClick={() => {
                    if (selectedCard.status === "assigned") {
                      setIsCardDetailsOpen(true);
                    }
                  }}
                  data-card-id={selectedCard.id}
                >
                  <div className="cardPageSlideBottom">
                    <span className="cardPageTitle">
                      {t("cards.cardPage.previewTitle")}
                    </span>

                    <span className="cardPageSuffix">
                      {selectedCard.status === "requested"
                        ? t("cards.cardPage.pendingShort")
                        : formatCardMaskedSuffix(selectedCard.maskedPan)}
                    </span>
                  </div>
                </button>
              ) : null}
            </div>
          </div>

          <div className="cardPageBalance">
            <span className="cardPageBalanceLabel">
              {t("cards.cardPage.balanceLabel")}
            </span>
            {isBalanceLoading ? (
              <span
                className="cardPageBalanceSkeleton skeletonShimmer"
                aria-hidden="true"
              />
            ) : (
              <div className="popupEsimConfirmAmount cardPageBalanceAmount">
                <span className="popupEsimConfirmAmountText cardPageBalanceCurrency">
                  $
                </span>
                <span className="popupEsimConfirmAmountText">
                  {balanceParts.integer}
                </span>
                <span className="accountAmountGray cardPageBalanceFraction">
                  .{balanceParts.fractional}
                </span>
              </div>
            )}
          </div>

          <div className="cardPageActions">
            <button
              type="button"
              className="walletActionsBtn cardPageActionButton"
              onClick={() => {
                if (!selectedCard) {
                  return;
                }

                navigate("/card-top-up", {
                  state: {
                    cardId: selectedCard.id,
                    backTo: "/card",
                  },
                });
              }}
              disabled={isInitialLoading || !canTopUp}
            >
              <DepositIcon />
              <span>{t("account.deposit")}</span>
            </button>

            <button
              type="button"
              className="walletActionsBtn cardPageActionButton"
              onClick={() => setIsCardDetailsOpen(true)}
              disabled={isInitialLoading || !isAssignedCard}
            >
              <CredentialsIcon />
              <span>{t("cards.cardPage.credentials")}</span>
            </button>
          </div>

          {isInitialLoading ? (
            <History
              className="cardPageHistory"
              history={[]}
              isLoading
              error={null}
              onRetry={() => {}}
              isBalanceVisible
              activeCurrency="usdt"
            />
          ) : showHistory ? (
            <History
              className="cardPageHistory"
              history={isCardHistoryLoading ? [] : visibleHistory}
              isLoading={isCardHistoryLoading || activityLoading || isActivityStale}
              error={visibleActivityError}
              onRetry={refreshActivity}
              isBalanceVisible
              activeCurrency="usdt"
            />
          ) : (
            <div className="cardPageHistoryEmpty">
              <div className="cardPageHistoryInfo">
                <span className="cardPageHistoryTitle">
                  {selectedCard.status === "requested"
                    ? t("cards.cardPage.requestTitle")
                    : !selectedCard.initialDepositCompleted
                    ? t("cards.cardPage.initialDepositTitle")
                    : t("cards.cardPage.historyTitle")}
                </span>
                <span className="cardPageHistoryText">
                  {selectedCard.status === "requested"
                    ? t("cards.cardPage.requestText")
                    : !selectedCard.initialDepositCompleted
                    ? t("cards.cardPage.initialDepositText")
                    : t("cards.cardPage.historyText")}
                </span>
              </div>
            </div>
          )}
        </section>
      </div>

      <PopupCardDetails
        isOpen={isCardDetailsOpen}
        onClose={closeCardDetails}
        cardNumber={
          selectedSensitiveDetails?.cardNumberFull ??
          selectedCard?.maskedPan ??
          "—"
        }
        expiry={
          selectedSensitiveDetails?.expiry ??
          selectedCard?.expiry ??
          "—"
        }
        cvv={selectedSensitiveDetails?.cardCvv ?? "—"}
        country="Singapore"
        city="Singapore"
        address="20 Maxwell Road 08-01D Maxwell House"
        postalCode="069113"
      />
    </>
  );
}
