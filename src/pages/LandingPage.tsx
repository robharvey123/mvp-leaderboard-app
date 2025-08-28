import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Check, Shield, Trophy, BarChart3, Zap, Users, Upload, Lock, Star, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

/**
 * MVP Cricket App — Marketing / Welcome Page
 * -----------------------------------------
 * Drop this file at: src/pages/LandingPage.tsx
 * Route it as '/' and place your existing app behind '/app' or '/admin'.
 * Uses Tailwind + shadcn/ui. All content is UK‑English and club‑friendly.
 */

export default function LandingPage() {
  const features = useMemo(
    () => [
      { icon: <Trophy className="h-6 w-6" aria-hidden />, title: "MVP scoring that feels fair", text: "Custom points for runs, wickets, catches and milestones. Penalties for ducks and drop‑offs—tuned for village cricket." },
      { icon: <BarChart3 className="h-6 w-6" aria-hidden />, title: "Leaderboards & insights", text: "Beautiful charts for players, teams and seasons. Filter by format, opponent and venue in a click." },
      { icon: <Upload className="h-6 w-6" aria-hidden />, title: "Play‑Cricket PDF import", text: "Drag in a scorecard PDF—get instant results, points and season aggregates. No data entry." },
      { icon: <Users className="h-6 w-6" aria-hidden />, title: "Built for clubs", text: "Multi‑team, multi‑season, and multi‑club by design. Perfect for 1st XI to Sunday social sides." },
      { icon: <Shield className="h-6 w-6" aria-hidden />, title: "Own your data", text: "Export anytime. Role‑based access for captains, scorers and committee." },
      { icon: <Zap className="h-6 w-6" aria-hidden />, title: "5‑minute setup", text: "Create your club, invite captains, and publish your first leaderboard before nets has finished." },
    ],
    []
  );

  const faqs = useMemo(
    () => [
      { q: "What is the MVP scoring system?", a: "A transparent points engine that rewards runs, wickets, maidens, catches and big milestones. It also supports penalties (e.g. ducks). Scoring bands are configurable per club season." },
      { q: "Do we need Play‑Cricket access?", a: "No. You can import PDFs exported from Play‑Cricket results pages. Direct API sync is coming soon for clubs with site admin rights." },
      { q: "How is the app priced?", a: "A generous Free plan to get started, then Club and Pro tiers for unlimited seasons, advanced analytics and API sync." },
      { q: "Can players see their own stats?", a: "Yes. Share a public leaderboard link or enable private player dashboards for your club members." },
      { q: "Is our data secure?", a: "Yes. Data is encrypted in transit and at rest. Admin roles control who can import, edit and publish." },
    ],
    []
  );

  const pricing = useMemo(
    () => [
      { name: "Free", price: "£0", blurb: "Perfect for a single team getting started.", cta: { label: "Start free", to: "/signup" }, perks: ["1 team, 1 season", "PDF import (manual)", "Core MVP scoring", "Public leaderboard"] },
      { name: "Club", price: "£19/mo", highlight: true, blurb: "Best for most village clubs with 2–5 teams.", cta: { label: "Start 14‑day trial", to: "/signup" }, perks: ["Up to 5 teams, unlimited seasons", "Advanced charts & filters", "Captain/Scorer roles", "CSV export"] },
      { name: "Pro", price: "£39/mo", blurb: "For larger clubs & leagues.", cta: { label: "Talk to us", to: "/contact" }, perks: ["Unlimited teams & seasons", "Play‑Cricket API sync (beta)", "Custom scoring presets", "Priority support"] },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden bg-sky-50">
        {/* darker gradient overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-sky-100 via-sky-200/70 to-sky-50" />
        <div className="relative container mx-auto px-4 pt-24 pb-16">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <Badge>For village & club cricket</Badge>
              <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-neutral-900">
                Leaderboards your club will actually brag about.
              </h1>
              <p className="mt-4 text-lg text-neutral-800 max-w-xl">
                The MVP Cricket App turns scorecards into instant, fair leaderboards—beautiful charts, player insights and season stories in minutes.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-2xl">
                  <Link to="/signup">Start free</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-2xl">
                  <Link to="/demo">View live demo</Link>
                </Button>
              </div>
              <p className="mt-3 text-sm text-neutral-700 flex items-center gap-2">
                <Lock className="h-4 w-4" /> No card required. Cancel anytime.
              </p>
            </div>
            <div className="lg:pl-6">
              <MockScreenshot />
            </div>
          </div>
        </div>
      </section>

      {/* ...rest of the page unchanged... */}

      <SiteFooter />
    </div>
  );
}

/* ————————————————————————————
 * Bits & bobs
 * ———————————————————————————— */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {children}
    </span>
  );
}

function SectionHeading({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <div className="text-center">
      {kicker && <p className="text-sm uppercase tracking-wider text-neutral-500">{kicker}</p>}
      <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3 text-lg">
          <span className="h-8 w-8 grid place-items-center rounded-xl bg-sky-50 text-sky-700 font-semibold">{n}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-neutral-700">{text}</CardContent>
    </Card>
  );
}

function Logo({ name }: { name: string }) {
  return (
    <div className="h-10 px-3 grid place-items-center rounded-xl border bg-white text-neutral-500 text-sm">
      {name}
    </div>
  );
}

function MockScreenshot() {
  return (
    <div className="rounded-2xl border bg-white shadow-sm p-3">
      <div className="aspect-[16/10] w-full rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 grid place-items-center">
        <div className="text-center">
          <div className="text-sm text-neutral-500">App preview</div>
          <div className="mt-2 inline-flex gap-2">
            <span className="h-2 w-20 rounded bg-neutral-300" />
            <span className="h-2 w-28 rounded bg-neutral-300" />
            <span className="h-2 w-16 rounded bg-neutral-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 rounded-xl bg-sky-600" />
          <span className="font-semibold tracking-tight">MVP Cricket App</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-700">
          <a href="#pricing" className="hover:text-neutral-900">Pricing</a>
          <a href="#faq" className="hover:text-neutral-900">FAQ</a>
          <Link to="/demo" className="hover:text-neutral-900">Demo</Link>
          <Link to="/contact" className="hover:text-neutral-900">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex rounded-xl"><Link to="/auth/sign-in">Sign in</Link></Button>
          <Button asChild className="rounded-xl"><Link to="/auth/sign-up">Start free</Link></Button>
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto px-4 py-10 grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 rounded-xl bg-sky-600" />
            <span className="font-semibold tracking-tight">MVP Cricket App</span>
          </div>
          <p className="mt-3 text-sm text-neutral-600">
            Built by club cricketers for club cricketers. Make every over count.
          </p>
        </div>
        <div>
          <div className="font-medium">Product</div>
          <ul className="mt-3 space-y-2 text-sm text-neutral-700">
            <li><Link to="/demo" className="hover:underline">Live demo</Link></li>
            <li><a href="#pricing" className="hover:underline">Pricing</a></li>
            <li><a href="#faq" className="hover:underline">FAQs</a></li>
          </ul>
        </div>
        <div>
          <div className="font-medium">Company</div>
          <ul className="mt-3 space-y-2 text-sm text-neutral-700">
            <li><Link to="/contact" className="hover:underline">Contact</Link></li>
            <li><Link to="/terms" className="hover:underline">Terms</Link></li>
            <li><Link to="/privacy" className="hover:underline">Privacy</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-neutral-500">© {new Date().getFullYear()} MVP Cricket App. All rights reserved.</div>
    </footer>
  );
}
