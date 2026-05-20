import { useTranslation } from "react-i18next";
import MenuGroup from "@/components/shared/MenuGroup";
import MenuItem from "@/components/shared/MenuItem";
type PaymentDetailsProps = {
  exchangeRate: string;
  merchantName: string;
};

export default function PaymentDetails({
  exchangeRate,
  merchantName,
}: PaymentDetailsProps) {
  const { t } = useTranslation();
  return (
    <MenuGroup className="space-y-px overflow-hidden p-2 rounded-[24px] bg-white/6">
      <MenuItem label={t("payment.exchangeRate")} value={exchangeRate} clickable={false} className="border-0" inGroup={true} labelClassName="text-sm text-white/50" valueClassName="text-sm font-medium text-white" />
      <MenuItem label={t("payment.merchant")} value={merchantName} clickable={false} className="border-0" inGroup={true} isLastInGroup={true} labelClassName="text-sm text-white/50" valueClassName="text-sm font-medium text-white" />
    </MenuGroup>
  );
}
