import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";

type PersonalFormValues = {
    lastName?: string;
    firstName?: string;
    middleName?: string;
};

type PersonalFormChangeHandlers = {
    lastName?: (value: string) => void;
    firstName?: (value: string) => void;
    middleName?: (value: string) => void;
};

type PersonalFormProps = {
    className?: string;
    showRemember?: boolean;
    errorMessage?: string | null;
    defaultValues?: PersonalFormValues;
    values?: PersonalFormValues;
    onChange?: PersonalFormChangeHandlers;
    remember?: boolean;
    onRememberChange?: (value: boolean) => void;
};

type NameInputProps = {
    id: string;
    name: string;
    placeholder: string;
    value?: string;
    defaultValue?: string;
    withDivider?: boolean;
    onValueChange?: (value: string) => void;
};

function NameInput({
    id,
    name,
    placeholder,
    value,
    defaultValue,
    withDivider = false,
    onValueChange,
}: NameInputProps) {
    const inputClass =
        "w-full bg-transparent pb-4 text-base text-white placeholder:text-white/40 outline-none transition-colors";

    return (
        <input
            id={id}
            name={name}
            type="text"
            className={cn(inputClass, withDivider && "border-b border-white/8 focus:border-white/60")}
            placeholder={placeholder}
            value={value}
            defaultValue={value === undefined ? defaultValue : undefined}
            onChange={(e) => onValueChange?.(e.target.value)}
        />
    );
}

export default function PersonalForm({
    className,
    showRemember = true,
    errorMessage = null,
    defaultValues,
    values,
    onChange,
    remember = false,
    onRememberChange,
}: PersonalFormProps) {
    const { t } = useTranslation();
    return (
        <>
            <section className={cn("mt-5 space-y-2 rounded-3xl bg-white/6 px-5 pt-5 pb-2", className)}>
                <div className="space-y-5">
                    <NameInput
                        id="last-name"
                        name="lastName"
                        placeholder={t("personalForm.lastName")}
                        value={values?.lastName}
                        defaultValue={defaultValues?.lastName ?? ""}
                        withDivider
                        onValueChange={onChange?.lastName}
                    />
                    <NameInput
                        id="first-name"
                        name="firstName"
                        placeholder={t("personalForm.firstName")}
                        value={values?.firstName}
                        defaultValue={defaultValues?.firstName ?? ""}
                        withDivider
                        onValueChange={onChange?.firstName}
                    />
                    <NameInput
                        id="middle-name"
                        name="middleName"
                        placeholder={t("personalForm.middleName")}
                        value={values?.middleName}
                        defaultValue={defaultValues?.middleName ?? ""}
                        onValueChange={onChange?.middleName}
                    />
                </div>
            </section>
            {(errorMessage || showRemember) && (
                <div className="pl-4">
                    {errorMessage && (
                        <p className="mb-2 text-sm text-red-400">
                            {errorMessage}
                        </p>
                    )}
                    {showRemember && (
                        <button
                            type="button"
                            onClick={() => onRememberChange?.(!remember)}
                            className="flex items-center gap-2 text-sm font-medium text-white/40"
                        >
                            <span
                                className={cn(
                                    "flex h-4 w-4 items-center justify-center rounded-full border text-[10px] transition-colors",
                                    remember ? "border-[#3F8CFF] bg-[#3F8CFF] text-white" : "border-white/40 bg-transparent"
                                )}
                            >
                                {remember ? "✓" : ""}
                            </span>
                            <span>{t("personalForm.remember")}</span>
                        </button>
                    )}
                </div>
            )}
        </>
    );
}

