// ──────────────────────────────────────────────────────────────────────────────
// File: src/pages/DemoPage.tsx
// Public, read‑only "tour" so prospects can click around without signing in.
// Route: /demo
// ──────────────────────────────────────────────────────────────────────────────
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Trophy, Users, Shield } from "lucide-react";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-semibold tracking-tight">MVP Cricket App</Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="rounded-xl"><Link to="/auth/sign-in">Sign in</Link></Button>
            <Button asChild className="rounded-xl"><Link to="/auth/sign-up">Start free</Link></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">See the app in action</h1>
          <p className="mt-3 text-neutral-700">This is a safe, public demo using sample data that mirrors a village club season.
            No sign‑in required. The full app lives at <code className="px-1 rounded bg-neutral-100">/app</code> once you create a club.</p>
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-sky-600"/> Club Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="text-neutral-700 text-sm">
              Explore overall MVP rankings with filters by team, season and format.
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-sky-600"/> Season Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-neutral-700 text-sm">
              Points by category, batting/bowling trends, and form charts.
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-sky-600"/> Player Pages</CardTitle>
            </CardHeader>
            <CardContent className="text-neutral-700 text-sm">
              Runs & wickets by match, rolling form, and milestones.
            </CardContent>
          </Card>
        </div>

        {/* Fake embed/preview block */}
        <section className="mt-10 rounded-2xl border bg-white p-4">
          <div className="aspect-[16/9] rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 grid place-items-center">
            <div className="text-center">
              <div className="text-sm text-neutral-500">Interactive preview</div>
              <div className="mt-2 inline-flex gap-2">
                <span className="h-2 w-20 rounded bg-neutral-300" />
                <span className="h-2 w-28 rounded bg-neutral-300" />
                <span className="h-2 w-16 rounded bg-neutral-300" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-neutral-600 flex items-center gap-2"><Shield className="h-4 w-4"/> Sample data only</div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="rounded-xl"><Link to="/">Back</Link></Button>
              <Button asChild className="rounded-xl"><Link to="/auth/sign-up">Create your club</Link></Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

