import { cn } from "@/utils/cn";
type MenuGroupProps = {
  children: React.ReactNode;
  className?: string;
};

export default function MenuGroup({ children, className }: MenuGroupProps) {
  return (
    <div className={cn("overflow-hidden rounded-3xl bg-[#121622]", className)}>
      {children}
    </div>
  );
}
  