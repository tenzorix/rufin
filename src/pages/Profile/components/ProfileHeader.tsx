import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Avatar from "@/components/shared/Avatar";
import { Info } from "lucide-react";
import { useProfileQuery } from "@/api/hooks";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { useNavigate } from "react-router";

type ProfileHeaderProps = {
  avatarUrl?: string;
};

export default function ProfileHeader({ avatarUrl }: ProfileHeaderProps) {
  const { t } = useTranslation();
  const { data: profile, isLoading, isError } = useProfileQuery();
  const navigate = useNavigate();
  let initFirstName: string | undefined;
  let initLastName: string | undefined;
  let initPhotoUrl: string | undefined;
  try {
    const lp = retrieveLaunchParams();
    const userFromInit =
      lp?.tgWebAppData?.user ||
      // @ts-expect-error: совместимость с разными версиями SDK
      lp?.initDataUnsafe?.user ||
      // @ts-expect-error: совместимость с разными версиями SDK
      lp?.initData?.user;

    initFirstName = userFromInit?.first_name;
    initLastName = userFromInit?.last_name;
    initPhotoUrl = userFromInit?.photo_url;
  } catch {
  }

  const nameFromInit = [initFirstName, initLastName].filter(Boolean).join(" ").trim();

  const displayName = nameFromInit || t("common.profile");
  const displayAvatarUrl = initPhotoUrl || avatarUrl;

  const levelName = profile?.level_name;
  const calculatedLevel = profile?.calculated_level;

  const localizedLevelName = useMemo(() => {
    if (!levelName) return null;
    const map: Record<string, string> = {
      Начинающий: t("loyalty.beginnerName"),
      Бронзовый: t("loyalty.bronzeName"),
      Серебряный: t("loyalty.silverName"),
      Золотой: t("loyalty.goldName"),
    };
    return map[levelName] ?? levelName;
  }, [levelName, t]);

  const status = isLoading
    ? t("profileHeader.loading")
    : isError
      ? t("profileHeader.loadError")
      : localizedLevelName
        ? localizedLevelName
        : calculatedLevel != null
          ? t("profileHeader.level", { n: calculatedLevel })
          : t("profileHeader.beginner");

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 size-15 overflow-hidden rounded-full ring-2 ring-white/10">
        <Avatar
          username={displayName}
          avatarUrl={displayAvatarUrl}
          className="size-full object-cover text-2xl"
        />
      </div>
      <h2 className="text-2xl font-bold text-white">
        {isLoading ? t("profileHeader.loading") : displayName}
      </h2>
      <div className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-white/20 px-1.5" onClick={() => {
        navigate("/loyalty");
      }}>
        <span className="text-sm font-medium text-white">{status}</span>
        <button
          type="button"
          aria-label={t("profileHeader.statusDetails")}
          className="text-white/60 transition-colors [-webkit-tap-highlight-color:transparent]"

        >
          <Info className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
