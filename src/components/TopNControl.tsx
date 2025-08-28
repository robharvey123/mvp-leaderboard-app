import { useFilters } from "@/context/FilterContext";

export default function TopNControl({ label = "Top" }: { label?: string }) {
  const { topN, setTopN } = useFilters();
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600">{label}</label>
      <input
        type="number"
        min={1}
        max={50}
        value={topN}
        onChange={(e) => setTopN(parseInt(e.target.value || "10", 10))}
        className="w-16 border rounded px-2 py-1 text-sm"
      />
    </div>
  );
}
