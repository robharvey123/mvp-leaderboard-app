import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export default function QuickTile({
  to,
  title,
  subtitle,
  icon,
}: {
  to: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border bg-white hover:shadow-md transition
                 p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-neutral-100 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <div className="font-semibold">{title}</div>
          {subtitle && (
            <div className="text-sm text-neutral-500">{subtitle}</div>
          )}
        </div>
      </div>
      <ChevronRight className="opacity-60 group-hover:translate-x-0.5 transition" />
    </Link>
  );
}
