import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/shared/PageHeader";
import MenuGroup from "@/components/shared/MenuGroup";
import MenuItem from "@/components/shared/MenuItem";
import { useBackButton } from "@/hooks/useBackButton";

function Language() {
    const { t, i18n } = useTranslation();
    const [selected, setSelected] = useState(() => (i18n.language.startsWith("en") ? "en" : "ru"));

    useEffect(() => {
        setSelected(i18n.language.startsWith("en") ? "en" : "ru");
    }, [i18n.language]);

    useBackButton();

    const languages = [
        { code: "ru" as const, label: t("language.ru") },
        { code: "en" as const, label: t("language.en") },
    ];

    return (
        <div className="mx-auto w-full max-w-md space-y-6">
            <PageHeader title={t("language.title")} />
            <MenuGroup className="mt-8 rounded-[24px]">
                {languages.map((lang, index) => (
                    <MenuItem
                        key={lang.code}
                        label={lang.label}
                        value={selected === lang.code ? <Check className="size-4 text-white" /> : undefined}
                        onClick={() => {
                            setSelected(lang.code);
                            void i18n.changeLanguage(lang.code);
                        }}
                        clickable={false}
                        showChevron={false}
                        className="border-0 p-4"
                        inGroup={true}
                        isLastInGroup={index === languages.length - 1}
                    />
                ))}
            </MenuGroup>
        </div>
    );
}
export default Language;
