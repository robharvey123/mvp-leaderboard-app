import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchMatchSummary, fetchMatchBreakdown } from "../lib/fetchMatchData";

export default function MatchCentre() {
  const { id } = useParams<{ id: string }>();
  const [summary, setSummary] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const s = await fetchMatchSummary(id);
        setSummary(s);
        const d = await fetchMatchBreakdown(id);
        setDetail(d);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [id]);

  if (!id) return <div className="p-6">Missing match id</div>;
  if (!summary) return <div className="p-6">Loading match…</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            {summary.team} vs {summary.opponent}
          </h1>
          <div className="opacity-75">{summary.match_date}</div>
          <div className="opacity-75">{summary.venue || ""}</div>
        </div>
        <div className="text-right">
          <div className="text-lg">Score</div>
          <div className="font-semibold">
            {summary.team_score || "—"} vs {summary.opponent_score || "—"}
          </div>
          {summary.mvp_player && (
            <div className="opacity-80 mt-1">
              MVP: <span className="font-medium">{summary.mvp_player}</span> ({summary.mvp_points})
            </div>
          )}
        </div>
      </div>

      {detail && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white/5 rounded-2xl p-4 overflow-x-auto">
            <h2 className="font-semibold mb-3">Batting</h2>
            <table className="min-w-[600px] w-full text-sm">
              <thead className="text-left opacity-80">
                <tr>
                  <th className="py-2 pr-3">Appearance</th>
                  <th className="py-2 pr-3">Runs</th>
                  <th className="py-2 pr-3">4s</th>
                  <th className="py-2 pr-3">6s</th>
                  <th className="py-2 pr-3">Balls</th>
                </tr>
              </thead>
              <tbody>
                {(detail.batting || []).map((r: any, idx: number) => (
                  <tr key={idx} className="border-t border-white/10">
                    <td className="py-2 pr-3">{r.appearance_id}</td>
                    <td className="py-2 pr-3">{r.runs ?? "—"}</td>
                    <td className="py-2 pr-3">{r.fours ?? "—"}</td>
                    <td className="py-2 pr-3">{r.sixes ?? "—"}</td>
                    <td className="py-2 pr-3">{r.balls ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 overflow-x-auto">
            <h2 className="font-semibold mb-3">Bowling</h2>
            <table className="min-w-[600px] w-full text-sm">
              <thead className="text-left opacity-80">
                <tr>
                  <th className="py-2 pr-3">Appearance</th>
                  <th className="py-2 pr-3">Overs</th>
                  <th className="py-2 pr-3">Mdns</th>
                  <th className="py-2 pr-3">Runs</th>
                  <th className="py-2 pr-3">Wkts</th>
                </tr>
              </thead>
              <tbody>
                {(detail.bowling || []).map((r: any, idx: number) => (
                  <tr key={idx} className="border-t border-white/10">
                    <td className="py-2 pr-3">{r.appearance_id}</td>
                    <td className="py-2 pr-3">{r.overs ?? "—"}</td>
                    <td className="py-2 pr-3">{r.maidens ?? "—"}</td>
                    <td className="py-2 pr-3">{r.runs ?? "—"}</td>
                    <td className="py-2 pr-3">{r.wickets ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
