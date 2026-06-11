import ExchangeWidget from "@/components/common/ExchangeWidget";
import ExchangeSubmitButton from "@/components/common/ExchangeSubmitButton";
import ExchangeHistory from "@/components/common/ExchangeHistory";
import TopBar from "@/components/shared/TopBar";
import { usePreferencesStore } from "@/store/usePreferencesStore";
import SBPPromoBanner from "./components/SBPPromoBanner";

export default function Exchange() {
  const assetsHidden = usePreferencesStore((s) => s.assetsHidden);

  return (
    <div className="p-4">
      <div className="mx-auto w-full max-w-md">
        <div className="space-y-4">
          <TopBar />
          <div className="space-y-3">
            <ExchangeWidget />
            <ExchangeSubmitButton />
          </div>
          <SBPPromoBanner />
          <ExchangeHistory hidden={assetsHidden} />
        </div>
      </div>
    </div>
  );
}
