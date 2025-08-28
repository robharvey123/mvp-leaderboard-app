// src/pages/HomePage.tsx
export default function HomePage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Welcome to MVP Leaderboard</h1>
      <p className="text-text-soft">
        Jump into analytics or tweak your scoring engine. Use the sidebar, or quick actions below.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <a
          href="/analytics/club"
          className="block rounded-2xl border border-brand-100 bg-white p-4 hover:bg-brand-50/40 transition"
        >
          <div className="text-lg font-semibold mb-1">Club Overview</div>
          <div className="text-sm text-text-soft">High-level snapshot across teams and seasons.</div>
        </a>

        <a
          href="/admin/scoring"
          className="block rounded-2xl border border-brand-100 bg-white p-4 hover:bg-brand-50/40 transition"
        >
          <div className="text-lg font-semibold mb-1">Scoring Engine</div>
          <div className="text-sm text-text-soft">Tune batting, bowling, and fielding rules.</div>
        </a>
      </div>
    </div>
  );
}
