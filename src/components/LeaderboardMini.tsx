type Row = { player: string; points: number; badges?: string[] };

export default function LeaderboardMini({ rows }: { rows: Row[] }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Top Performers</h2>
        <a href="/leaderboard" className="text-sm text-blue-600 hover:underline">
          View full leaderboard
        </a>
      </div>

      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li key={r.player} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 text-right tabular-nums text-neutral-500">{i + 1}.</div>
              <div className="font-medium">{r.player}</div>
              {r.badges?.length ? (
                <div className="flex gap-1">
                  {r.badges.map((b) => (
                    <span
                      key={b}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="font-semibold tabular-nums">{r.points}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
