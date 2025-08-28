// src/pages/admin/ValidateMatchPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { ensureZeroRows } from "@/import/ensureZeroRows";
import { runAnomalyChecks, type Check } from "@/import/anomalyChecks";
import useContextIds from "@/hooks/useContextIds";
import useSeasonBounds from "@/hooks/useSeasonBounds";
import { recomputeSeasonPoints } from "@/lib/scoring/recompute";

type Player = { id: string; full_name: string };

export default function ValidateMatchPage() {
  const { matchId = "" } = useParams();
  const nav = useNavigate();
  const { clubId, seasonId } = useContextIds();
  const { start, end } = useSeasonBounds(seasonId);

  const [teamId, setTeamId] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [checks, setChecks] = useState<Check[]>([]);
  const [checksRunning, setChecksRunning] = useState(false);

  // Load team + squad (fallback to all club players)
  useEffect(() => {
    (async () => {
      const { data: m } = await supabase
        .from("matches")
        .select("team_id")
        .eq("id", matchId)
        .maybeSingle();
      if (m?.team_id) setTeamId(m.team_id);

      let list: Player[] = [];
      const { data: squad } = await supabase
        .from("squads")
        .select("player_id, players:player_id(id, full_name)")
        .eq("team_id", m?.team_id ?? "")
        .order("player_id");

      if (squad?.length) {
        list = squad.map((r: any) => ({
          id: r.players.id,
          full_name: r.players.full_name,
        }));
      } else {
        const { data: generic } = await supabase
          .from("players")
          .select("id, full_name")
          .eq("club_id", clubId);
        list = (generic ?? []) as Player[];
      }
      setPlayers(list);
      setPicked(Object.fromEntries(list.map((p) => [p.id, true])));
    })();
  }, [matchId, clubId]);

  async function runChecks() {
    setChecksRunning(true);
    try {
      const res = await runAnomalyChecks(matchId);
      setChecks(res);
    } finally {
      setChecksRunning(false);
    }
  }

  // ✅ Auto-run anomaly checks when the match changes
  useEffect(() => {
    if (matchId) runChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  async function publish() {
    setBusy(true);
    try {
      const selected = Object.entries(picked)
        .filter(([, on]) => on)
        .map(([id]) => id);

      await ensureZeroRows(matchId, teamId, selected);

      // Try to set parse_status if present; ignore if column missing
      const up = await supabase
        .from("matches")
        .update({ parse_status: "validated" })
        .eq("id", matchId);
      if (up.error && !String(up.error.message).includes("parse_status")) {
        throw up.error;
      }

      if (clubId && seasonId && start && end) {
        await recomputeSeasonPoints({ clubId, seasonId, start, end });
      }
      nav(`/leaderboard?matchId=${matchId}`);
    } finally {
      setBusy(false);
    }
  }

  const blocking = checks.some((c) => c.severity === "error");

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Validate Match</h1>
      <p className="text-sm text-neutral-600">
        Match: <code>{matchId}</code> · Team: <code>{teamId || "-"}</code>
      </p>

      <section className="rounded-2xl border bg-white">
        {players.length === 0 ? (
          <div className="px-4 py-3 text-sm text-neutral-500">
            No players found for this club/team.
          </div>
        ) : (
          players.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-3 px-4 py-2 border-b last:border-b-0"
            >
              <input
                type="checkbox"
                checked={!!picked[p.id]}
                onChange={(e) =>
                  setPicked((s) => ({ ...s, [p.id]: e.target.checked }))
                }
              />
              <span>{p.full_name}</span>
            </label>
          ))
        )}
      </section>

      <section className="rounded-2xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Anomaly checks</h2>
          <button
            onClick={runChecks}
            disabled={checksRunning}
            className={`px-3 py-2 rounded ${
              checksRunning ? "bg-neutral-300" : "bg-black text-white"
            }`}
          >
            {checksRunning ? "Running…" : "Run checks"}
          </button>
        </div>

        {checks.length === 0 ? (
          <p className="text-sm text-neutral-500 mt-2">
            No issues yet. Run checks to validate.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {checks.map((c, i) => (
              <li
                key={i}
                className={`text-sm ${
                  c.severity === "error" ? "text-red-600" : "text-amber-600"
                }`}
              >
                [{c.severity.toUpperCase()}] {c.scope} — {c.message}
                {c.player_id ? ` (player ${c.player_id})` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        className={`px-4 py-2 rounded ${
          busy || blocking ? "bg-neutral-300" : "bg-black text-white"
        }`}
        disabled={busy || blocking}
        onClick={publish}
        title={blocking ? "Fix blocking errors before publishing" : ""}
      >
        {busy ? "Publishing…" : "Publish & Zero-fill"}
      </button>

      {blocking && (
        <p className="text-xs text-red-600">
          Resolve blocking errors to enable publish.
        </p>
      )}
    </div>
  );
}
