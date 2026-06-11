import { useEffect } from "react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router";
import { useExchangeStore } from "@/store/useExchangeStore";
import Home from "@/pages/Home";
import Layout from "@/components/shared/Layout";
import Profile from "@/pages/Profile";
import Turnover from "@/pages/Turnover";
import Wallet from "@/pages/Wallet";
import Exchange from "@/pages/Exchange";
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
import DepositSelect from "@/pages/DepositSelect";
import RefShare from "@/pages/RefShare";
import Withdraw from "@/pages/Withdraw";
import WithdrawSelect from "@/pages/WithdrawSelect";
import OfficeSelect from "@/pages/OfficeSelect";
import Payment from "@/pages/Payment";
import CashOrder from "@/pages/CashOrder";
import PaymentCards from "@/payment/pages/Cards";
import PaymentCard from "@/payment/pages/Card";
import PaymentNewCard from "@/payment/pages/NewCard";
import PaymentCardTopUp from "@/payment/pages/CardTopUp";

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
    <MemoryRouter initialEntries={["/wallet"]}>
      <ResetCalculatorOnRouteChange />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/rufin" element={<Exchange />} />
          <Route path="/card" element={<PaymentCard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route element={<Layout showBottomNav={false} />}>
          <Route path="/turnover" element={<Turnover />} />
          <Route path="/exchange-checkout" element={<ExchangeCheckout />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/cards" element={<PaymentCards />} />
          <Route path="/new-card" element={<PaymentNewCard />} />
        </Route>
        <Route element={<SecondaryLayout />}>

          <Route path="/kyc" element={<KYC />} />
          <Route path="/referral" element={<Referral />} />
          <Route path="/language" element={<Language />} />
          <Route path="/address" element={<Address />} />
          <Route path="/loyalty" element={<Loyalty />} />
          <Route path="/rules" element={<ServiceRules />} />
          <Route path="/about" element={<About />} />

          <Route path="/deposit-select" element={<DepositSelect />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/withdraw-select" element={<WithdrawSelect />} />
          <Route path="/office-select" element={<OfficeSelect />} />
          <Route path="/card-top-up" element={<PaymentCardTopUp />} />
          <Route path="/cash-deposit" element={<CashOrder mode="deposit" />} />
          <Route path="/cash-withdraw" element={<CashOrder mode="withdraw" />} />
          <Route path="/ref-share" element={<RefShare />} />
        </Route>
        <Route path="/payment" element={<Payment />} />
      </Routes>
    </MemoryRouter>
  );
}
