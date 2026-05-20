import { useEffect } from "react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router";
import { useExchangeStore } from "@/store/useExchangeStore";
import Home from "@/pages/Home";
import Layout from "@/components/shared/Layout";
import Profile from "@/pages/Profile";
import Turnover from "@/pages/Turnover";
import Wallet from "@/pages/Wallet";
import ExchangeCheckout from "@/pages/ExchangeCheckout";
import KYC from "@/pages/KYC";
import Referral from "@/pages/Referral";
import SecondaryLayout from "@/components/shared/SecondaryLayout";
import Language from "@/pages/Language";
import Address from "@/pages/Address";
import Loyalty from "@/pages/Loyalty";
import ServiceRules from "@/pages/ServiceRules";
import About from "@/pages/About";
import Deposit from "@/pages/Deposit";
import RefShare from "@/pages/RefShare";
import Withdraw from "@/pages/Withdraw";
import Payment from "@/pages/Payment";

function ResetCalculatorOnRouteChange() {
  const { pathname } = useLocation();
  const setFromAmount = useExchangeStore((s) => s.setFromAmount);

  useEffect(() => {
    setFromAmount("");
  }, [pathname, setFromAmount]);

  return null;
}

export default function Router() {
  return (
    <MemoryRouter>
      <ResetCalculatorOnRouteChange />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route element={<Layout showBottomNav={false} />}>
          <Route path="/turnover" element={<Turnover />} />
          <Route path="/exchange-checkout" element={<ExchangeCheckout />} />
          <Route path="/withdraw" element={<Withdraw />} />
        </Route>
        <Route element={<SecondaryLayout />}>

          <Route path="/kyc" element={<KYC />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/language" element={<Language />} />
          <Route path="/address" element={<Address />} />
          <Route path="/loyalty" element={<Loyalty />} />
          <Route path="/rules" element={<ServiceRules />} />
          <Route path="/about" element={<About />} />

          <Route path="/deposit" element={<Deposit />} />
          <Route path="/ref-share" element={<RefShare />} />
        </Route>
        <Route path="/payment" element={<Payment />} />
      </Routes>
    </MemoryRouter>
  );
}
