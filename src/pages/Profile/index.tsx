import ProfileHeader from "./components/ProfileHeader";
import ProfileMenu from "./components/ProfileMenu";
import RefCodeBlock from "@/components/common/RefCodeBlock";
import { useProfileQuery } from "@/api/hooks";

export default function Profile() {
  const { data: profile } = useProfileQuery();

  const referalCode = profile?.referal_code || "—";

  return (
    <div className="p-4 font-profile-rounded">
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4">
        <ProfileHeader />
        <RefCodeBlock refCode={referalCode} />
        <ProfileMenu />
      </div>
    </div>
  );
}
