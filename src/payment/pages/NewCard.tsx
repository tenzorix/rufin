import NewCard from "../components/cards/NewCard";
import { useTelegramBackButton } from "../hooks/useTelegramBackButton";
import { useLocation } from "react-router";

export default function NewCardPage() {
  const location = useLocation();
  const backTo =
    typeof location.state?.backTo === "string"
      ? location.state.backTo
      : "/cards";

  useTelegramBackButton(backTo);

  return (
    <div
      className="home paymentsPage newCardPage"
      style={{
        paddingTop:
          "calc(40px + (var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) * 1.5))",
      }}
    >
      <NewCard />
    </div>
  );
}
