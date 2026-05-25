import Card from "../components/cards/Card";
import { useTelegramBackButton } from "../hooks/useTelegramBackButton";
import TopBar from "@/components/shared/TopBar";

export default function CardPage() {
  useTelegramBackButton("/");

  return (
    <div
      className="home paymentsPage cardPage"
      style={{
        paddingTop:
          "calc(40px + (var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) * 1.5))",
      }}
    >
      <div className="cardPageTopBar">
        <TopBar />
      </div>
      <Card />
    </div>
  );
}
