import ProfileBar from "./ProfileBar";
import CurrencyTabs from "./CurrencyTabs";

export default function TopBar() {
  return (
    <header className="mb-4">
      <div className="flex items-center justify-between gap-3 py-3 text-white">
        <ProfileBar />
        <CurrencyTabs />
      </div>
    </header>
  );
}

