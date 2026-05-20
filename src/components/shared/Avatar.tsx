import { cn } from "@/utils/cn";
type AvatarProps = {
    username: string;
    avatarUrl?: string;
    className?: string;
}

export default function Avatar({ username, avatarUrl, className }: AvatarProps) {
    const initial = username.charAt(0).toUpperCase();

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt={username}
                className={cn(
                    "block size-[30px] shrink-0 rounded-full object-cover shadow-[0_0_14px_rgba(0,0,0,0.35)]",
                    className
                )}
            />
        );
    }

    return (
        <div
            className={cn(
                "flex size-[30px] shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#3F8CFF] to-[#8B5CFF] text-base font-semibold text-white shadow-[0_0_14px_rgba(0,0,0,0.35)]",
                className
            )}
        >
            {initial}
        </div>
    );
}