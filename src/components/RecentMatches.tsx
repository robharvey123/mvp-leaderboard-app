type Match = {
  date: string;
  opponent: string;
  result: "W" | "L" | "T" | "A";
  margin?: string;
};

const chip = (r: Match["result"]) =>
  r === "W"
    ? "bg-emerald-100 text-emerald-700"
    : r === "L"
    ? "bg-rose-100 text-rose-700"
    : r === "T"
    ? "bg-amber-100 text-amber-700"
    : "bg-neutral-100 text-neutral-700";

export default function RecentMatches({ items }: { items: Match[] }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Recent Matches</h2>
        <a href="/fixtures" className="text-sm text-blue-600 hover:underline">
          Fixtures & results
        </a>
      </div>

      <ul className="space-y-2">
        {items.map((m, i) => (
          <li key={i} className="flex items-center justify-between">
            <div>
              <div className="font-medium">{m.opponent}</div>
              <div className="text-sm text-neutral-500">{m.date}</div>
            </div>
            <div className={`text-xs px-2 py-1 rounded-full ${chip(m.result)}`}>
              {m.result}
              {m.margin ? ` • ${m.margin}` : ""}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
