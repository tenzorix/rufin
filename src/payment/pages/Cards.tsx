import Cards from "../components/cards/Cards";
import { useTelegramBackButton } from "../hooks/useTelegramBackButton";

export default function CardsPage() {
  useTelegramBackButton("/");

  return (
    <div
      className="home paymentsPage"
      style={{
        paddingTop:
          "calc(40px + (var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) * 1.5))",
      }}
    >
      <Cards />
    </div>
  );
}
