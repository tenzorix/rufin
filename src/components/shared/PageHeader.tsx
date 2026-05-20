import { cn } from "@/utils/cn";

type PageHeaderProps = {
    title: string;
    compact?: boolean;
}
function PageHeader({ title, compact }: PageHeaderProps) {
    return (
        <header className={cn("text-center", !compact && "mb-4")}>
            <h1 className="text-[18px] font-profile-rounded whitespace-pre-line text-center font-bold text-white">{title}</h1>
        </header>
    );
}
export default PageHeader;