import { useTranslation } from "react-i18next";

import { useNavigate } from "react-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { DEPOSIT_QR_LOGO } from "@/constants/deposit";
import WalletOperationItem from "./WalletOperationItem";
import { useBottomNavStore } from "@/store/useBottomNavStore";
import { decodeQrFromImageFile } from "@/utils/decodeQrFromImage";
import { toast } from "@/store/useToastStore";
import UsdtCurrencyIcon from "@/assets/icons/UsdtCurrencyIcon";
import RubCurrencyIcon from "@/assets/icons/RubCurrencyIcon";
import RufinCardIcon from "@/assets/icons/RufinCardIcon";
import AddCardIcon from "@/assets/icons/AddCardIcon";
import "./WalletActions.scss";

const MODAL_ANIMATION_DURATION = 500;

type OperationItem = {
  logo: ReactNode;
  text: string;
  onClick?: () => void;
};

const QrScanLogo = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M11.4513 10.7159C11.4532 10.6987 11.4549 10.6813 11.4562 10.6636L11.4564 10.6543C11.4551 10.6753 11.4534 10.6959 11.4513 10.7159ZM10.8564 11.1041C10.8317 11.1134 10.8047 11.1215 10.775 11.1281C10.803 11.1215 10.8332 11.113 10.8564 11.1041ZM10.7184 11.1387C10.708 11.1402 10.6972 11.1415 10.6862 11.1428C10.6964 11.1417 10.7085 11.1402 10.7184 11.1387ZM1.8651 2.24954C1.87474 2.19343 1.88872 2.14658 1.90515 2.10729C1.88947 2.1445 1.87625 2.18852 1.86662 2.24085C1.86605 2.24368 1.86567 2.2467 1.8651 2.24954ZM11.9774 4.78451C11.9951 4.7857 12.0154 4.78662 12.0332 4.78716C12.0455 4.78751 12.0578 4.78772 12.0702 4.78772C12.2185 4.78772 12.3664 4.76581 12.4983 4.7114C12.5929 4.6723 12.6802 4.61638 12.7559 4.53987C12.9367 4.35701 13 4.10822 13 3.853M0.830635 4.7847C0.820245 4.78395 0.809855 4.78319 0.799465 4.78225C0.743548 4.77714 0.688575 4.76846 0.634925 4.75542C0.698399 4.77091 0.764139 4.78036 0.830635 4.7847Z" fill="white"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M9.60114 5.59777C10.114 5.59777 10.5291 6.01356 10.5291 6.52645C10.5289 7.03915 10.1138 7.45437 9.60114 7.45437H3.41095C2.89825 7.45437 2.48322 7.03915 2.48303 6.52645C2.48303 6.01356 2.89806 5.59777 3.41095 5.59777H9.60114ZM3.87642 11.1494C3.91421 11.1494 3.95199 11.1508 3.98939 11.1538C4.00734 11.1553 4.02528 11.157 4.04304 11.1593C4.10312 11.1668 4.16187 11.1787 4.21873 11.1957C4.34511 11.2337 4.46185 11.2974 4.55952 11.395C4.74087 11.5766 4.80435 11.8237 4.80435 12.0774C4.80435 12.3299 4.74012 12.5763 4.55801 12.7567C4.37628 12.9367 4.12956 13 3.87642 13H2.35835C1.6335 13 1.03182 12.8132 0.609044 12.3902C0.186832 11.9716 0 11.3758 0 10.659V9.147C0 8.89254 0.062718 8.6445 0.241804 8.46164C0.422024 8.27764 0.668551 8.21228 0.921879 8.21228C1.05903 8.21228 1.1941 8.23098 1.31802 8.27688C1.42419 8.31637 1.52204 8.37568 1.60573 8.46013C1.78652 8.64299 1.8498 8.89178 1.8498 9.147V10.5525C1.8498 10.8081 1.9129 10.9415 1.98279 11.0127C2.06119 11.0884 2.19475 11.1494 2.43391 11.1494H3.87642ZM10.7797 11.1272L10.7495 11.1334L10.7148 11.1392C10.6979 11.1417 10.6804 11.1436 10.6621 11.1451L10.6324 11.1472L10.6099 11.1485C10.5939 11.1491 10.5772 11.1494 10.56 11.1494H9.11753C8.86364 11.1494 8.61598 11.2133 8.43443 11.395C8.25308 11.5766 8.18961 11.8237 8.18961 12.0774C8.18961 12.3299 8.25365 12.5763 8.43595 12.7567C8.61768 12.9367 8.86439 13 9.11753 13H10.6349C11.3633 13 11.967 12.8128 12.3902 12.3894C12.8128 11.9708 13 11.3759 13 10.659V9.147C13 8.89178 12.9367 8.64299 12.7559 8.46013C12.666 8.36926 12.5597 8.30749 12.4442 8.26838C12.3269 8.22871 12.2003 8.21228 12.0721 8.21228C11.9398 8.21228 11.8093 8.23003 11.689 8.27329C11.5788 8.31278 11.4774 8.3736 11.3912 8.46164C11.2123 8.6445 11.1502 8.89273 11.1502 9.147V10.5525C11.1502 10.806 11.082 10.9405 11.0066 11.0119C10.9698 11.0476 10.9214 11.0799 10.8564 11.1041C10.8332 11.113 10.8077 11.1205 10.7797 11.1272ZM2.35835 0H3.87642C4.12956 0 4.37628 0.0632847 4.55801 0.243316C4.74012 0.423724 4.80435 0.670062 4.80435 0.922634C4.80435 1.17634 4.74087 1.42343 4.55952 1.60498C4.37798 1.78671 4.13032 1.85056 3.87642 1.85056H2.43391C2.19513 1.85056 2.06119 1.91101 1.98279 1.98657C1.95446 2.01529 1.92744 2.0542 1.90515 2.10729C1.88947 2.1445 1.87625 2.18852 1.86662 2.24085C1.85604 2.29903 1.8498 2.36723 1.8498 2.44751V3.853C1.8498 4.10822 1.78652 4.35701 1.60573 4.53987C1.51411 4.63244 1.40568 4.69478 1.28799 4.7337C1.19391 4.76468 1.09416 4.78092 0.992342 4.78602C0.968917 4.78716 0.945492 4.78772 0.921879 4.78772C0.880696 4.78772 0.839892 4.78602 0.799465 4.78225C0.743548 4.77714 0.688575 4.76846 0.634925 4.75542C0.52139 4.72765 0.414656 4.68061 0.320768 4.60826C0.293377 4.5871 0.266929 4.56387 0.241804 4.53836C0.062718 4.3555 0 4.10746 0 3.853V2.33492C0 1.61707 0.18702 1.02087 0.610556 0.602244C1.03352 0.184187 1.63445 0 2.35835 0ZM11.4513 10.7159C11.4534 10.6959 11.4551 10.6753 11.4564 10.6543L11.4562 10.6636C11.4549 10.6813 11.4532 10.6987 11.4513 10.7159Z" fill="white"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M11.9774 4.78451C11.9706 4.78413 11.9625 4.78357 11.9557 4.783C11.9636 4.78376 11.9695 4.78395 11.9774 4.78451Z" fill="white"/>
    <path d="M12.0305 4.78716C12.0128 4.78659 11.995 4.78565 11.9774 4.78451C11.9574 4.78319 11.9378 4.78149 11.9183 4.77922C11.8881 4.77563 11.8584 4.7711 11.8284 4.76505C11.7521 4.74994 11.6784 4.72671 11.6092 4.69346C11.5297 4.65549 11.4562 4.60467 11.3912 4.53836C11.2123 4.3555 11.1502 4.10727 11.1502 3.853V2.44751C11.1502 2.194 11.085 2.06176 11.0096 1.99035C10.9307 1.91346 10.7947 1.85056 10.56 1.85056H9.11753C8.86364 1.85056 8.61598 1.78671 8.43443 1.60498C8.25308 1.42343 8.18961 1.17634 8.18961 0.922634C8.18961 0.670062 8.25365 0.423724 8.43595 0.243316C8.61768 0.0632847 8.86439 0 9.11753 0H10.6349C11.3623 0 11.9661 0.183809 12.3894 0.602244C12.813 1.02087 13 1.61707 13 2.33492V3.853C13 4.10822 12.9367 4.35701 12.7559 4.53987C12.6802 4.61638 12.5929 4.6723 12.4983 4.7114C12.3664 4.76581 12.2185 4.78772 12.0702 4.78772L12.0305 4.78716Z" fill="white"/>
  </svg>
);

const ImageLogo = () => (
  <svg width="17" height="14" viewBox="0 0 17 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.41309 13.0703C0.854492 13.0703 0 12.2227 0 10.6709V2.39941C0 0.847656 0.854492 0 2.41309 0H13.9043C15.4697 0 16.3174 0.847656 16.3174 2.39941V10.6709C16.3174 12.2227 15.4697 13.0703 13.9043 13.0703H2.41309ZM1.76367 2.61133V9.50879L3.39062 8.07324C3.6709 7.82031 3.9375 7.69727 4.26562 7.69727C4.58008 7.69727 4.90137 7.82715 5.18848 8.08691L6.44629 9.21484L9.52246 6.45996C9.83691 6.18652 10.1719 6.05664 10.5479 6.05664C10.9033 6.05664 11.2656 6.19336 11.5596 6.4668L14.5537 9.26953V2.61133C14.5537 2.03027 14.2598 1.76367 13.7129 1.76367H2.60449C2.05762 1.76367 1.76367 2.03027 1.76367 2.61133ZM5.65332 6.76758C4.72363 6.76758 3.96484 6.00195 3.96484 5.07227C3.96484 4.15625 4.72363 3.38379 5.65332 3.38379C6.57617 3.38379 7.33496 4.15625 7.33496 5.07227C7.33496 6.00195 6.57617 6.76758 5.65332 6.76758Z" fill="white"/>
</svg>
)

const LinkLogo = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.28711 10.958C6.6377 10.8213 6.11133 10.5273 5.7627 10.1787C4.00586 8.42188 4.00586 5.94043 5.75586 4.19727L8.19629 1.75C9.94629 0.00683594 12.4209 0 14.1846 1.75684C15.9414 3.51367 15.9414 6.00195 14.1914 7.74512L12.3115 9.61133C12.5029 8.93457 12.3936 8.15527 12.127 7.54688L13.0088 6.66504C14.0957 5.57812 14.1025 4.04688 12.9951 2.93945C11.9014 1.8457 10.3701 1.8457 9.27637 2.93945L6.93848 5.27051C5.84473 6.36426 5.84473 7.89551 6.94531 8.99609C7.31445 9.36523 7.88184 9.61816 8.55176 9.69336L7.28711 10.958ZM8.6543 4.97656C9.30371 5.11328 9.83691 5.41406 10.1787 5.75586C11.9355 7.5127 11.9355 9.99414 10.1855 11.7373L7.74512 14.1846C6.00195 15.9277 3.52051 15.9346 1.76367 14.1777C0.00683594 12.4209 0 9.93262 1.75 8.19629L3.63672 6.32324C3.43848 7 3.54785 7.78613 3.81445 8.39453L2.93945 9.26953C1.8457 10.3633 1.8457 11.8877 2.94629 12.9951C4.04004 14.0889 5.57129 14.0889 6.67188 12.9951L9.00293 10.6641C10.0967 9.57715 10.0967 8.03906 8.99609 6.93848C8.62695 6.56934 8.05957 6.31641 7.38965 6.24121L8.6543 4.97656Z" fill="white"/>
</svg>
)

const DepositLogo = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1.9209 5.50293L1.81836 7.66309L2.82324 6.56934L8.95508 0.444336C9.41309 0 9.9668 0.0205078 10.3633 0.410156C10.7461 0.779297 10.8281 1.34668 10.3496 1.83887L4.22461 7.9707L3.14453 8.96191L5.35938 8.87305H7.89551C8.45605 8.87305 8.90039 9.2832 8.90039 9.80957C8.90039 10.3428 8.46973 10.7803 7.88867 10.7803H1.03906C0.416992 10.7803 0 10.3633 0 9.74805L0.00683594 2.90527C0.00683594 2.33105 0.444336 1.88672 0.977539 1.88672C1.51074 1.88672 1.9209 2.33105 1.9209 2.8916V5.50293Z" fill="white"/>
</svg>
)

const WithdrawLogo = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.464844 10.3701C0.0888672 10.001 0 9.43359 0.478516 8.94141L6.61035 2.80957L7.69043 1.81836L5.46875 1.90723H2.93945C2.37891 1.90723 1.92773 1.49707 1.92773 0.970703C1.92773 0.4375 2.3584 0 2.94629 0H9.78906C10.418 0 10.8281 0.416992 10.8281 1.03223V7.875C10.8281 8.44238 10.3906 8.89355 9.85742 8.89355C9.32422 8.89355 8.91406 8.44922 8.91406 7.88184V5.27734L9.00977 3.11719L8.01172 4.2041L1.87988 10.3359C1.42188 10.7803 0.861328 10.7598 0.464844 10.3701Z" fill="white"/>
</svg>
)

const ExchangeLogo = () => (
  <svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.916016 7.32812C0.410156 7.32812 0 6.91797 0 6.40527V5.63965C0 3.46582 1.53125 2.13281 4.0332 2.13281H9.13281V0.683594C9.13281 0.259766 9.39258 0 9.80957 0C10.0078 0 10.165 0.0683594 10.2949 0.177734L13.1523 2.58398C13.4668 2.85059 13.4668 3.28125 13.1523 3.54785L10.2949 5.9541C10.165 6.06348 10.0078 6.13184 9.80957 6.13184C9.39258 6.13184 9.13281 5.87891 9.13281 5.45508V3.93066H3.9375C2.63867 3.93066 1.83203 4.67578 1.83203 5.87207V6.40527C1.83203 6.91797 1.42871 7.32812 0.916016 7.32812ZM6.67871 13.0293C6.67871 13.4531 6.41895 13.7129 6.00195 13.7129C5.81055 13.7129 5.64648 13.6445 5.5166 13.5352L2.65918 11.1289C2.34473 10.8623 2.34473 10.4316 2.65918 10.165L5.5166 7.75879C5.64648 7.64941 5.81055 7.58105 6.00195 7.58105C6.41895 7.58105 6.67871 7.83398 6.67871 8.25781V9.78223H11.8809C13.1729 9.78223 13.9795 9.03711 13.9795 7.84082V7.30762C13.9795 6.79492 14.3828 6.38477 14.8955 6.38477C15.4014 6.38477 15.8115 6.79492 15.8115 7.30762V8.07324C15.8115 10.2471 14.2803 11.5801 11.7783 11.5801H6.67871V13.0293Z" fill="white"/>
</svg>
)

export default function WalletActions() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const lockBottomNav = useBottomNavStore((s) => s.lock);
  const unlockBottomNav = useBottomNavStore((s) => s.unlock);
  const [operationsModalOpen, setOperationsModalOpen] = useState(false);
  const [operationsModalVisible, setOperationsModalVisible] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [decoding, setDecoding] = useState(false);

  useEffect(() => {
    // Preload logo for QR на экране пополнения
    new Image().src = DEPOSIT_QR_LOGO;
  }, []);

  const hasModalOpen = operationsModalOpen || linkModalOpen;

  useEffect(() => {
    if (!hasModalOpen) return;
    lockBottomNav();
    return () => unlockBottomNav();
  }, [hasModalOpen, lockBottomNav, unlockBottomNav]);

  const openOperationsModal = () => {
    setOperationsModalOpen(true);
    requestAnimationFrame(() => setOperationsModalVisible(true));
  };

  const closeOperationsModal = () => {
    setOperationsModalVisible(false);
    setTimeout(() => setOperationsModalOpen(false), MODAL_ANIMATION_DURATION);
  };

  const openLinkModal = () => {
    setLinkModalOpen(true);
    requestAnimationFrame(() => setLinkModalVisible(true));
  };

  const closeLinkModal = () => {
    setLinkModalVisible(false);
    setTimeout(() => setLinkModalOpen(false), MODAL_ANIMATION_DURATION);
  };

  const handleLinkPay = () => {
    const normalizedLink = paymentLink.trim();
    if (!normalizedLink) return;

    closeLinkModal();
    setTimeout(() => {
      navigate(`/payment?qr=${encodeURIComponent(normalizedLink)}`);
    }, MODAL_ANIMATION_DURATION);
  };

  const openLinkModalFromOperations = () => {
    closeOperationsModal();
    setTimeout(openLinkModal, MODAL_ANIMATION_DURATION);
  };

  const openGallery = () => {
    fileInputRef.current?.click();
  };

  const openGalleryFromOperations = () => {
    closeOperationsModal();
    setTimeout(openGallery, MODAL_ANIMATION_DURATION);
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // allow selecting same file again
    e.target.value = "";

    if (!file) return;

    setDecoding(true);
    try {
      const qr = await decodeQrFromImageFile(file);
      if (!qr) {
        toast.error("Не удалось найти QR-код на фото");
        return;
      }

      // Go to payment as if scanned
      navigate("/payment", { state: { qrCode: qr } });
    } catch {
      toast.error("Не удалось обработать фото");
    } finally {
      setDecoding(false);
    }
  };

  const operationItems: OperationItem[] = [
    { logo: <QrScanLogo />, text: "Сканировать QR-код", onClick: () => navigate('/payment')},
    { logo: <ImageLogo />, text: decoding ? "Обработка…" : "Загрузить фото", onClick: openGalleryFromOperations },
    { logo: <LinkLogo />, text: "Вставить ссылку", onClick: openLinkModalFromOperations },
  ];

  const operationItemsBottom: OperationItem[] = [
    { logo: <DepositLogo />, text: "Пополнить", onClick: () => navigate('/deposit') },
    { logo: <WithdrawLogo />, text: "Вывести", onClick: () => navigate('/withdraw') },
    { logo: <ExchangeLogo />, text: "Обменять", onClick: () => navigate('/home') },
  ];

  return (
    <div className="mt-6 mb-10">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileSelected}
      />
      <div className="grid grid-cols-4 gap-1 w-full">
        <button
          type="button"
          onClick={() => navigate('/deposit')}
          className="walletActionsBtn"
        >

          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.06129 3.99962C1.60935 3.05039 2.30728 2.26161 3.15506 1.63326C3.9984 1.00236 4.92386 0.551933 5.93141 0.281972C6.93897 0.0120125 7.96472 -0.0641035 9.00868 0.0536265C10.0545 0.178353 11.0543 0.516017 12.008 1.06661C12.9573 1.61465 13.7451 2.30904 14.3716 3.14978C15 3.99751 15.4505 4.92291 15.723 5.92598C15.993 6.93349 16.0656 7.96013 15.9409 9.0059C15.8206 10.0542 15.4864 11.053 14.9383 12.0022C14.3903 12.9515 13.6923 13.7402 12.8446 14.3686C11.9987 15.0039 11.0732 15.4544 10.0682 15.7199C9.06065 15.9898 8.03268 16.0647 6.98429 15.9444C5.94034 15.8267 4.94373 15.4938 3.99445 14.9457C3.04074 14.3951 2.24969 13.696 1.62132 12.8482C0.997378 12.0031 0.550423 11.0767 0.280449 10.0692C0.00791337 9.06614 -0.0659885 8.04172 0.0587452 6.99595C0.179042 5.94762 0.513224 4.94884 1.06129 3.99962ZM5.92957 11.6095C6.13806 11.7299 6.37081 11.7519 6.62782 11.6755L10.3005 10.6465C10.4989 10.5896 10.6507 10.4702 10.7557 10.2883C10.8581 10.1109 10.8827 9.92996 10.8296 9.74549C10.7783 9.56802 10.6617 9.42678 10.4798 9.32178C10.3024 9.21934 10.1096 9.19974 9.9016 9.26298L8.67823 9.63013L7.66244 10.0373L8.54901 8.68615L10.4122 5.45922C10.5249 5.26405 10.5505 5.06596 10.4892 4.86493C10.4278 4.66391 10.2973 4.50577 10.0977 4.39053C9.89807 4.27529 9.69587 4.24135 9.49109 4.28872C9.2863 4.33609 9.12757 4.45737 9.01488 4.65253L7.15171 7.87946L6.42099 9.32944L6.26187 8.25286L5.97585 6.99657C5.93547 6.78992 5.81991 6.63154 5.62917 6.52142C5.4473 6.41642 5.26446 6.38479 5.08067 6.42654C4.89875 6.47528 4.75657 6.58837 4.65413 6.76579C4.55168 6.94322 4.52637 7.1356 4.57818 7.34293L5.51663 11.034C5.58344 11.2973 5.72109 11.4892 5.92957 11.6095Z" fill="white" />
          </svg>


          <span>{t("wallet.deposit")}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/withdraw')}
          className="walletActionsBtn"
        >
          <svg width="15" height="16" viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.005 12.0004C13.4912 12.9496 12.8369 13.7384 12.0421 14.3667C11.2515 14.9976 10.3839 15.4481 9.4393 15.718C8.49471 15.988 7.53307 16.0641 6.55437 15.9464C5.5739 15.8216 4.63662 15.484 3.74252 14.9334C2.85257 14.3853 2.11392 13.691 1.52658 12.8502C0.937479 12.0025 0.515178 11.0771 0.259676 10.074C0.00657528 9.06651 -0.0615066 8.03987 0.0554308 6.9941C0.16821 5.94577 0.481504 4.94699 0.995316 3.99777C1.50913 3.04854 2.16343 2.25975 2.95822 1.63141C3.75126 0.996076 4.61887 0.545646 5.56106 0.280121C6.50564 0.0101612 7.46937 -0.0646732 8.45223 0.0556178C9.43093 0.173348 10.3653 0.506231 11.2552 1.05427C12.1493 1.60486 12.8909 2.30403 13.48 3.15177C14.065 3.99694 14.484 4.92328 14.7371 5.93079C14.9926 6.93386 15.0619 7.95828 14.9449 9.00405C14.8321 10.0524 14.5189 11.0512 14.005 12.0004ZM9.44102 4.39046C9.24557 4.2701 9.02737 4.2481 8.78642 4.32446L5.34332 5.35348C5.15725 5.41041 5.015 5.5298 4.91656 5.71167C4.82052 5.88909 4.79743 6.07004 4.84728 6.25451C4.89538 6.43198 5.00469 6.57322 5.17519 6.67822C5.34153 6.78066 5.52222 6.80026 5.71725 6.73702L6.86416 6.36987L7.81646 5.96272L6.9853 7.31385L5.23858 10.5408C5.13294 10.7359 5.10888 10.934 5.16641 11.1351C5.22394 11.3361 5.34628 11.4942 5.53342 11.6095C5.72056 11.7247 5.91012 11.7586 6.1021 11.7113C6.29409 11.6639 6.44291 11.5426 6.54855 11.3475L8.29527 8.12054L8.98032 6.67056L9.1295 7.74714L9.39764 9.00343C9.4355 9.21008 9.54383 9.36846 9.72266 9.47858C9.89316 9.58358 10.0646 9.61521 10.2369 9.57346C10.4074 9.52472 10.5407 9.41163 10.6368 9.23421C10.7328 9.05678 10.7565 8.8644 10.708 8.65707L9.82815 4.96597C9.76552 4.70266 9.63648 4.51083 9.44102 4.39046Z" fill="white" />
          </svg>

          <span>{t("wallet.withdraw")}</span>
        </button>

        <button
          type="button"
          onClick={openOperationsModal}
          className="walletActionsBtn"
        >
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.81995 9.79549H4.47675C4.67512 9.79549 4.83517 9.7331 4.95689 9.60832C5.07861 9.48353 5.13948 9.32409 5.13948 9.12998V7.84749C5.13948 7.64876 5.07861 7.48931 4.95689 7.36915C4.83517 7.24437 4.67512 7.18198 4.47675 7.18198H2.81995C2.62158 7.18198 2.46154 7.24437 2.33981 7.36915C2.21809 7.48931 2.15723 7.64876 2.15723 7.84749V9.12998C2.15723 9.32409 2.21809 9.48353 2.33981 9.60832C2.46154 9.7331 2.62158 9.79549 2.81995 9.79549ZM0 4.50607H16V2.88388H0V4.50607ZM2.21809 12C1.48774 12 0.935475 11.8105 0.561285 11.4315C0.187095 11.0526 0 10.4934 0 9.7539V2.25303C0 1.51358 0.187095 0.954362 0.561285 0.57539C0.935475 0.191797 1.48774 0 2.21809 0H13.7819C14.5123 0 15.0645 0.191797 15.4387 0.57539C15.8129 0.958983 16 1.5182 16 2.25303V9.7539C16 10.4934 15.8129 11.0526 15.4387 11.4315C15.0645 11.8105 14.5123 12 13.7819 12H2.21809Z" fill="white" />
          </svg>

          <span>{t("wallet.operations")}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/payment')}
          className="walletActionsBtn bg-white"
        >

          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M14.0939 13.1888C14.0963 13.1676 14.0983 13.1462 14.1 13.1244L14.1002 13.113C14.0986 13.1388 14.0965 13.1641 14.0939 13.1888ZM13.3618 13.6666C13.3313 13.678 13.2981 13.688 13.2616 13.6961C13.296 13.688 13.3332 13.6775 13.3618 13.6666ZM13.1918 13.7091C13.179 13.711 13.1658 13.7126 13.1523 13.7143C13.1648 13.7129 13.1797 13.711 13.1918 13.7091ZM2.29551 2.76866C2.30737 2.6996 2.32458 2.64194 2.3448 2.59358C2.32551 2.63939 2.30923 2.69356 2.29737 2.75796C2.29668 2.76145 2.29621 2.76517 2.29551 2.76866ZM14.7415 5.88863C14.7632 5.8901 14.7882 5.89123 14.81 5.89189C14.8252 5.89231 14.8404 5.89258 14.8556 5.89258C15.0381 5.89258 15.2202 5.86561 15.3825 5.79865C15.499 5.75052 15.6064 5.6817 15.6996 5.58754C15.9221 5.36247 16 5.05627 16 4.74215M1.02232 5.88886C1.00953 5.88793 0.996745 5.887 0.983957 5.88584C0.915136 5.87956 0.847477 5.86887 0.781446 5.85283C0.859568 5.87189 0.940479 5.88352 1.02232 5.88886Z" fill="black" />
            <path fill-rule="evenodd" clip-rule="evenodd" d="M11.8168 6.88956C12.448 6.88956 12.9588 7.4013 12.9588 8.03255C12.9586 8.66357 12.4478 9.17461 11.8168 9.17461H4.19809C3.56708 9.17461 3.05627 8.66357 3.05603 8.03255C3.05603 7.4013 3.56684 6.88956 4.19809 6.88956H11.8168ZM4.77098 13.7224C4.81748 13.7224 4.86399 13.724 4.91002 13.7277C4.93211 13.7296 4.9542 13.7317 4.97605 13.7345C5.04999 13.7438 5.1223 13.7584 5.19228 13.7794C5.34783 13.8261 5.49151 13.9044 5.61172 14.0246C5.83492 14.2481 5.91304 14.5522 5.91304 14.8645C5.91304 15.1753 5.83399 15.4785 5.60986 15.7005C5.38619 15.9221 5.08254 16 4.77098 16H2.90258C2.01046 16 1.26994 15.7701 0.749593 15.2495C0.229947 14.7342 0 14.0009 0 13.1188V11.2578C0 10.9447 0.0771914 10.6394 0.297605 10.4143C0.519414 10.1879 0.822832 10.1074 1.13462 10.1074C1.30342 10.1074 1.46966 10.1304 1.62218 10.1869C1.75285 10.2355 1.87329 10.3085 1.97628 10.4125C2.19879 10.6375 2.27668 10.9437 2.27668 11.2578V12.9877C2.27668 13.3023 2.35434 13.4664 2.44036 13.5541C2.53685 13.6473 2.70123 13.7224 2.99558 13.7224H4.77098ZM13.2674 13.695L13.2302 13.7026L13.1874 13.7098C13.1667 13.7129 13.1451 13.7152 13.1225 13.717L13.086 13.7196L13.0584 13.7212C13.0386 13.7219 13.0181 13.7224 12.997 13.7224H11.2216C10.9091 13.7224 10.6043 13.801 10.3808 14.0246C10.1576 14.2481 10.0795 14.5522 10.0795 14.8645C10.0795 15.1753 10.1583 15.4785 10.3827 15.7005C10.6064 15.9221 10.91 16 11.2216 16H13.089C13.9856 16 14.7287 15.7696 15.2495 15.2485C15.7696 14.7333 16 14.0012 16 13.1188V11.2578C16 10.9437 15.9221 10.6375 15.6996 10.4125C15.5889 10.3006 15.458 10.2246 15.316 10.1765C15.1716 10.1276 15.0158 10.1074 14.8579 10.1074C14.6952 10.1074 14.5345 10.1293 14.3864 10.1825C14.2509 10.2311 14.126 10.306 14.02 10.4143C13.7998 10.6394 13.7233 10.9449 13.7233 11.2578V12.9877C13.7233 13.2997 13.6394 13.4652 13.5466 13.5531C13.5013 13.5971 13.4418 13.6368 13.3618 13.6666C13.3332 13.6775 13.3018 13.6868 13.2674 13.695ZM2.90258 0H4.77098C5.08254 0 5.38619 0.0778889 5.60986 0.299465C5.83399 0.521507 5.91304 0.824692 5.91304 1.13555C5.91304 1.4478 5.83492 1.75192 5.61172 1.97535C5.38828 2.19902 5.08347 2.27761 4.77098 2.27761H2.99558C2.7017 2.27761 2.53685 2.35201 2.44036 2.44501C2.40549 2.48035 2.37224 2.52825 2.3448 2.59358C2.32551 2.63939 2.30923 2.69356 2.29737 2.75796C2.28435 2.82957 2.27668 2.91351 2.27668 3.01232V4.74215C2.27668 5.05627 2.19879 5.36247 1.97628 5.58754C1.86352 5.70146 1.73006 5.77819 1.58521 5.82609C1.46943 5.86422 1.34666 5.88421 1.22134 5.89049C1.19251 5.89189 1.16368 5.89258 1.13462 5.89258C1.08393 5.89258 1.03371 5.89049 0.983957 5.88584C0.915136 5.87956 0.847477 5.86887 0.781446 5.85283C0.641711 5.81865 0.510346 5.76075 0.394792 5.6717C0.361079 5.64566 0.328528 5.61707 0.297605 5.58568C0.0771914 5.36061 0 5.05534 0 4.74215V2.87375C0 1.99023 0.230179 1.25645 0.751453 0.741223C1.27203 0.226691 2.01163 0 2.90258 0ZM14.0939 13.1888C14.0965 13.1641 14.0986 13.1388 14.1002 13.113L14.1 13.1244C14.0983 13.1462 14.0963 13.1676 14.0939 13.1888Z" fill="black" />
            <path fill-rule="evenodd" clip-rule="evenodd" d="M14.7415 5.88863C14.7331 5.88817 14.7231 5.88747 14.7147 5.88677C14.7245 5.8877 14.7317 5.88793 14.7415 5.88863Z" fill="black" />
            <path d="M14.8068 5.89189C14.7849 5.89119 14.7631 5.89003 14.7415 5.88863C14.7168 5.887 14.6926 5.88491 14.6687 5.88212C14.6315 5.8777 14.595 5.87212 14.558 5.86468C14.4641 5.84608 14.3734 5.81748 14.2883 5.77656C14.1904 5.72983 14.1 5.66729 14.02 5.58568C13.7998 5.36061 13.7233 5.0551 13.7233 4.74215V3.01232C13.7233 2.7003 13.6431 2.53755 13.5503 2.44966C13.4532 2.35503 13.2857 2.27761 12.997 2.27761H11.2216C10.9091 2.27761 10.6043 2.19902 10.3808 1.97535C10.1576 1.75192 10.0795 1.4478 10.0795 1.13555C10.0795 0.824692 10.1583 0.521507 10.3827 0.299465C10.6064 0.0778889 10.91 0 11.2216 0H13.089C13.9844 0 14.7275 0.226226 15.2485 0.741223C15.7698 1.25645 16 1.99023 16 2.87375V4.74215C16 5.05627 15.9221 5.36247 15.6996 5.58754C15.6064 5.6817 15.499 5.75052 15.3825 5.79865C15.2202 5.86561 15.0381 5.89258 14.8556 5.89258L14.8068 5.89189Z" fill="black" />
          </svg>


          <span>{t("wallet.pay")}</span>
        </button>
      </div>

      <div className="mt-6 flex flex-col items-start gap-2 self-stretch">
        <div className="pl-2 text-[14px] font-bold leading-none text-white">Валюты</div>
        <div className="flex w-full flex-col items-start gap-2 rounded-[20px] bg-white/[0.04] p-2">
          <div className="flex w-full items-center justify-between self-stretch pr-2">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9">
                <UsdtCurrencyIcon />
              </div>
              <div className="flex flex-col items-start py-1">
                <div className="text-[14px] font-bold leading-normal text-white">USDT</div>
                <div className="text-[12px] leading-[100%] [font-weight:510] text-white/60">82.30₽</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-0.5 text-[16px] font-bold leading-[100%] text-white">
                <span>1 000 000</span>
                <span>$</span>
              </div>
              <div className="flex items-start gap-1 text-[12px] leading-[100%] [font-weight:510] text-white/60">
                <span>823,000.20</span>
                <span>₽</span>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-white/[0.08]" />

          <div className="flex w-full items-center justify-between self-stretch pr-2">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9">
                <RubCurrencyIcon />
              </div>
              <div className="flex flex-col items-start py-1">
                <div className="text-[14px] font-bold leading-normal text-white">RUB</div>
                <div className="text-[12px] leading-[100%] [font-weight:510] text-white/60">0,012$</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-0.5 text-[16px] font-bold leading-[100%] text-white">
                <span>1 000 000</span>
                <span>₽</span>
              </div>
              <div className="flex items-start gap-1 text-[12px] leading-[100%] [font-weight:510] text-white/60">
                <span>12,150.67</span>
                <span>$</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-start gap-2 self-stretch">
        <div className="pl-2 text-[14px] font-bold leading-normal text-white">Карты</div>
        <div className="flex w-full flex-col items-start gap-2 rounded-[20px] bg-white/[0.04] p-2">
          <div className="flex w-full items-center justify-between self-stretch pr-2">
            <div className="flex items-center gap-2">
              <div className="h-[44px] w-[64px] shrink-0">
                <RufinCardIcon />
              </div>
              <div className="flex flex-col items-start py-1">
                <div className="text-[14px] font-bold leading-normal text-white">Карта Rufin</div>
                <div className="text-[12px] leading-[100%] [font-weight:510] text-white/60">*1234</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-0.5 text-[16px] font-bold leading-[100%] text-white">
                <span>1 000 000</span>
                <span>₽</span>
              </div>
              <div className="flex items-start gap-1 text-[12px] leading-[100%] [font-weight:510] text-white/60">
                <span>12,150.67</span>
                <span>$</span>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-white/[0.08]" />

          <div className="flex w-full items-center gap-2 self-stretch pr-2">
            <div className="h-[44px] w-[64px] shrink-0">
              <AddCardIcon />
            </div>
            <div className="text-[14px] font-bold leading-normal text-white">Добавить карту</div>
          </div>
        </div>
      </div>

      {operationsModalOpen && (
        <div className="fixed inset-0 z-50">
          <div
            role="button"
            tabIndex={0}
            className={`fixed inset-0 z-40 bg-[#080c19]/80 backdrop-blur-sm transition-opacity duration-250 ease-out ${
              operationsModalVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeOperationsModal}
            onKeyDown={(e) => e.key === "Escape" && closeOperationsModal()}
            aria-label={t("common.close")}
          />
          <div
            className={`fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-[#080c19] px-5 pb-4 pt-3 transition-transform duration-250 ease-out ${
              operationsModalVisible ? "translate-y-0" : "translate-y-full"
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="operations-modal-title"
          >
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-white/30" aria-hidden />
            <h2
              id="operations-modal-title"
              className="mb-6 text-center text-lg font-semibold text-white"
            >
              {t("wallet.operations")}
            </h2>

            <div className="operations-container">
              <div className="operations-container__top">
                {operationItems.map((item, index) => (
                  <>
                    <WalletOperationItem logo={item.logo} text={item.text} onClick={item.onClick} />
                    {index !== operationItems.length - 1 && <div className="operations-divider" />}
                  </>
                ))}
              </div>
              <div className="operations-container__bot">
                {operationItemsBottom.map((item, index) => (
                  <>
                    <WalletOperationItem logo={item.logo} text={item.text} onClick={item.onClick} />
                    {index !== operationItemsBottom.length - 1 && <div className="operations-divider" />}
                  </>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {linkModalOpen && (
        <div className="fixed inset-0 z-50">
          <div
            role="button"
            tabIndex={0}
            className={`fixed inset-0 z-40 bg-[#080c19]/80 backdrop-blur-sm transition-opacity duration-250 ease-out ${
              linkModalVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeLinkModal}
            onKeyDown={(e) => e.key === "Escape" && closeLinkModal()}
            aria-label={t("common.close")}
          />
          <div
            className={`fixed inset-x-0 bottom-0 z-50 rounded-t-3xl bg-[#080c19] px-5 pb-4 pt-3 transition-transform duration-250 ease-out ${
              linkModalVisible ? "translate-y-0" : "translate-y-full"
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="link-modal-title"
          >
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-white/30" aria-hidden />
            <h2 id="link-modal-title" className="mb-6 text-center text-lg font-semibold text-white">
              Вставить ссылку
            </h2>

            <div className="space-y-4">
              <input
                type="text"
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                placeholder="qr.nspk.ru/AB..."
                className="h-12 w-full rounded-2xl bg-white/8 px-4 text-base text-white placeholder:text-white/45 outline-none"
              />
              <button
                type="button"
                onClick={handleLinkPay}
                disabled={!paymentLink.trim()}
                className="h-12 w-full rounded-2xl bg-white text-sm font-bold text-[#080c19]"
              >
                Оплатить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
