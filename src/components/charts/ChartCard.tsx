import { ReactNode } from "react";

export default function ChartCard({
  title, subtitle, children, right,
}: { title: string; subtitle?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white dark:bg-neutral-900 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="h-64 md:h-72">{children}</div>
    </div>
  );
}
