// src/components/analytics/TeamComparison.tsx
type Props = {
  topN?: number; // ✨ NEW (optional)
};

export default function TeamComparison({ topN }: Props) {
  // build team aggregates -> players per team
  // if topN provided, slice per‑team arrays before charting
  // e.g., team.players = team.players.slice(0, topN)
  return (
    <section className="p-4 rounded-2xl shadow bg-white">
      <h2 className="font-semibold mb-2">Team‑by‑Team Comparison</h2>
      {/* your existing side‑by‑side charts/tables */}
    </section>
  );
}
