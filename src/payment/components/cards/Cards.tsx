import { useNavigate } from "react-router";
import LumoBlackIcon from "../../assets/svg/LumoBlack";
import EarthIcon from "../../assets/svg/earth";
import UsdIcon from "../../assets/svg/usd";
import { useCardsCatalog } from "../../hooks/useCards";
import { useI18n } from "../../i18n";

export default function Cards() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { loading, error, refresh } = useCardsCatalog();

  return (
    <div className="paymentsContainer cardsContainer">
      <section
        className="paymentsBlock cardsBlock"
        aria-label={t("cards.page.aria")}
      >
        {error ? (
          <div className="historyState historyState--error cardsPageState">
            <span>{error}</span>
            <button type="button" className="historyStateBtn" onClick={refresh}>
              {t("history.retry")}
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className="cardsButton"
          aria-label={t("cards.card.aria")}
          onClick={() => navigate("/new-card", { state: { backTo: "/cards" } })}
          disabled={loading}
          aria-busy={loading}
        >
          <div className="cardsPreview" aria-hidden="true">
            <div className="cardsPreviewContent">
              <LumoBlackIcon />
              <span className="cardsPreviewLabel">{t("cards.light.label")}</span>
            </div>
          </div>

          <div className="cardsInfo">
            <span className="cardsInfoTitle">{t("cards.card.title")}</span>

            <div className="cardsInfoMeta">
              <div className="cardsInfoMetaRow">
                <span className="cardsInfoMetaIconWrap" aria-hidden="true">
                  <EarthIcon />
                </span>
                <span className="cardsInfoMetaText">{t("cards.card.country")}</span>
              </div>

              <div className="cardsInfoMetaRow">
                <span
                  className="cardsInfoMetaIconWrap cardsInfoMetaIconWrap--usd"
                  aria-hidden="true"
                >
                  <UsdIcon />
                </span>
                <span className="cardsInfoMetaText">{t("cards.card.currency")}</span>
              </div>
            </div>
          </div>
        </button>
      </section>
    </div>
  );
}
