// src/components/ChartCard.tsx
import React from "react";

export default function ChartCard({
  title,
  subtitle,
  right,
  height = 260,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  height?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <header className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <h3 className="font-semibold leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        {right}
      </header>
      <div className="p-3" style={{ height }}>
        {children}
      </div>
    </section>
  );
}
