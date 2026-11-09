import { cn } from "@/lib/utils";
import { formatBDT } from "@/lib/utils";

export default function PrizeBadge({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  return (
    <span className={cn("prize-badge inline-flex items-center", className)}>
      {formatBDT(amount)}
    </span>
  );
}
