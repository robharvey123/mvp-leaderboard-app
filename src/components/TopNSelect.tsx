// src/components/TopNSelect.tsx
import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  value: number | "all";
  onChange: (v: number | "all") => void;
  className?: string;
};

const OPTIONS: (number | "all")[] = [5, 10, 20, 50, "all"];

export default function TopNSelect({ value, onChange, className }: Props) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 mb-1">Show</label>
      <Select value={String(value)} onValueChange={(v) => onChange(v === "all" ? "all" : Number(v))}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Top N" />
        </SelectTrigger>
        <SelectContent>
          {OPTIONS.map((opt) => (
            <SelectItem key={opt} value={String(opt)}>
              {opt === "all" ? "All players" : `Top ${opt}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
