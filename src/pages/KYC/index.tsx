import { useTranslation } from "react-i18next";
import PersonalForm from "@/components/common/PersonalForm";
import PageHeader from "@/components/shared/PageHeader";
import { useBackButton } from "@/hooks/useBackButton";
import { useUpdateFullnameMutation, useProfileQuery } from "@/api/hooks";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/store/useToastStore";

function parseFullname(fullname: string | undefined): { lastName: string; firstName: string; middleName: string } {
    const parts = (fullname || "").trim().split(/\s+/).filter(Boolean);
    return {
        lastName: parts[0] || "",
        firstName: parts[1] || "",
        middleName: parts.length >= 3 ? parts.slice(2).join(" ") : "",
    };
}

function normalizeNamePart(v: string) {
    return v.trim().replace(/\s+/g, " ");
}

export default function KYC() {
    const { t } = useTranslation();
    useBackButton();
    const { data: profile } = useProfileQuery();
    const defaults = useMemo(() => parseFullname(profile?.name ?? undefined), [profile?.name]);
    const [lastName, setLastName] = useState("");
    const [firstName, setFirstName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [showSuccessBadge, setShowSuccessBadge] = useState(false);

    useEffect(() => {
        setLastName(defaults.lastName);
        setFirstName(defaults.firstName);
        setMiddleName(defaults.middleName);
    }, [defaults.lastName, defaults.firstName, defaults.middleName]);

    const updateFullnameMutation = useUpdateFullnameMutation();
    useEffect(() => {
        if (!showSuccessBadge) return;
        const t = setTimeout(() => setShowSuccessBadge(false), 2000);
        return () => clearTimeout(t);
    }, [showSuccessBadge]);

    const isChanged = useMemo(() => {
        const current = {
            lastName: normalizeNamePart(lastName),
            firstName: normalizeNamePart(firstName),
            middleName: normalizeNamePart(middleName),
        };
        const base = {
            lastName: normalizeNamePart(defaults.lastName),
            firstName: normalizeNamePart(defaults.firstName),
            middleName: normalizeNamePart(defaults.middleName),
        };
        return (
            current.lastName !== base.lastName ||
            current.firstName !== base.firstName ||
            current.middleName !== base.middleName
        );
    }, [lastName, firstName, middleName, defaults.lastName, defaults.firstName, defaults.middleName]);

    const canSubmit =
        isChanged &&
        Boolean(normalizeNamePart(lastName) && normalizeNamePart(firstName)) &&
        !updateFullnameMutation.isPending;

    return (
        <div className="relative mx-auto w-full max-w-md space-y-6">
            <div className="grid grid-cols-3 items-center">
                <div />
                <PageHeader title={t("kyc.title")} compact />
                <button
                    type="button"
                    disabled={!canSubmit}
                    onClick={async () => {
                        try {
                            setError(null);
                            const nameRegex = /^[А-ЯЁа-яёA-Za-z\s-]+$/u;

                            const ln = normalizeNamePart(lastName);
                            const fn = normalizeNamePart(firstName);
                            const mn = normalizeNamePart(middleName);

                            if (!ln || !fn) {
                                setError(t("kyc.errorFillName"));
                                return;
                            }

                            const parts = [ln, fn, mn].filter(Boolean);
                            if (parts.some((p) => p.length < 2 || p.length > 64)) {
                                setError(t("kyc.errorPartLength"));
                                return;
                            }
                            if (parts.some((p) => !nameRegex.test(p))) {
                                setError(t("kyc.errorNameChars"));
                                return;
                            }

                            await updateFullnameMutation.mutateAsync({
                                lastName: ln,
                                firstName: fn,
                                middleName: mn ? mn : null,
                            });
                            toast.success(t("kyc.success"), 2000);
                        } catch (e) {
                            console.error("[KYC] update fullname failed:", e);
                        }
                    }}
                    className="whitespace-nowrap justify-self-end align-middle rounded-3xl bg-white/10 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                    {updateFullnameMutation.isPending ? "..." : t("kyc.done")}
                </button>
            </div>
            <PersonalForm
                className="card-style"
                showRemember={false}
                errorMessage={error}
                values={{
                    lastName,
                    firstName,
                    middleName,
                }}
                onChange={{
                    lastName: (v) => {
                        setLastName(v);
                        if (error) setError(null);
                    },
                    firstName: (v) => {
                        setFirstName(v);
                        if (error) setError(null);
                    },
                    middleName: (v) => {
                        setMiddleName(v);
                        if (error) setError(null);
                    },
                }}
            />
        </div>
    );
}