import { useTranslation } from "react-i18next";
import PageHeader from "@/components/shared/PageHeader";
import MenuGroup from "@/components/shared/MenuGroup";
import MenuItem from "@/components/shared/MenuItem";
import { useBackButton } from "@/hooks/useBackButton";
import { useAddressMapImage } from "@/hooks/useAddressMapImage";

const AddressIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.70996 2.95996C4.70996 1.33301 6.02246 0 7.65625 0C9.29004 0 10.5957 1.33301 10.5957 2.95996C10.5957 4.28613 9.7207 5.4209 8.50391 5.77637V10.0488C8.50391 11.6348 7.99121 12.8652 7.65625 12.8652C7.32129 12.8652 6.79492 11.6348 6.79492 10.0488V5.77637C5.58496 5.40723 4.70996 4.28613 4.70996 2.95996ZM6.82227 3.13086C7.38281 3.13086 7.83398 2.65918 7.83398 2.11914C7.83398 1.57227 7.38281 1.11426 6.82227 1.11426C6.28906 1.11426 5.81738 1.57227 5.81738 2.11914C5.81738 2.65918 6.28906 3.13086 6.82227 3.13086ZM7.64258 15.8457C2.94629 15.8457 0 14.3213 0 12.373C0 10.4727 2.75488 9.16699 5.55078 8.96191V10.5137C3.71875 10.6572 1.83887 11.3477 1.83887 12.2773C1.83887 13.46 4.25879 14.2461 7.64258 14.2461C11.0264 14.2461 13.4531 13.4531 13.4531 12.2773C13.4531 11.3477 11.5732 10.6572 9.74121 10.5137V8.96191C12.5371 9.16699 15.292 10.4727 15.292 12.373C15.292 14.3213 12.3389 15.8457 7.64258 15.8457Z" fill="white" />
    </svg>
  
  )

  const ClockIcon = () => (

    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.21875 14.4375C3.2334 14.4375 0 11.2041 0 7.21875C0 3.2334 3.2334 0 7.21875 0C11.2041 0 14.4375 3.2334 14.4375 7.21875C14.4375 11.2041 11.2041 14.4375 7.21875 14.4375ZM7.21875 12.6396C10.2197 12.6396 12.6396 10.2129 12.6396 7.21875C12.6396 4.21777 10.2197 1.79785 7.21875 1.79785C4.22461 1.79785 1.79785 4.21777 1.79785 7.21875C1.79785 10.2129 4.22461 12.6396 7.21875 12.6396ZM3.97168 8.26465C3.60254 8.26465 3.31543 7.9707 3.31543 7.60156C3.31543 7.23242 3.60254 6.94531 3.97168 6.94531H6.55566V3.34961C6.55566 2.98047 6.84961 2.69336 7.21875 2.69336C7.58789 2.69336 7.875 2.98047 7.875 3.34961V7.60156C7.875 7.9707 7.58789 8.26465 7.21875 8.26465H3.97168Z" fill="white"/>
</svg>
  )
const YANDEX_MAPS_LINK =
    "https://yandex.ru/maps/?um=constructor%3A4b1da329016fbf6ac484b0250d70e1d5e45a50ceb8b1d24ea1ef988d108d4f1b&source=constructorStatic";

function Address() {
    const { t } = useTranslation();
    useBackButton();
    const mapSrc = useAddressMapImage();

    return (
        <div className="mx-auto w-full max-w-md space-y-6">
            <PageHeader title={t("addressPage.title")} />
            <div className="mt-8 p-2 overflow-hidden rounded-[20px] ">
                <a href={YANDEX_MAPS_LINK} target="_blank" rel="noreferrer">
                    <img
                        src={mapSrc}
                        alt={t("common.map")}
                        className="w-full block rounded-2xl"
                        style={{ border: 0 }}
                    />
                </a>
            </div>

            <MenuGroup className="mt-3 rounded-[20px]">
                <MenuItem icon={AddressIcon} label={t("addressPage.office")} clickable={false} className="border-0" inGroup={true} />
                <MenuItem icon={ClockIcon} label={t("addressPage.hours")} clickable={false} className="border-0" inGroup={true} isLastInGroup={true} />
            </MenuGroup>

        </div>
    );
}
export default Address;