// src/pages/admin/ScoringConfigPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Save, Check, Loader2, Plus, X, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthOptional } from "@/context/auth-context"; // tolerant hook
import { useOrg } from "@/context/OrgContext";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "@/components/charts/Primitives";
import { calcBattingPoints, calcBowlingPoints, type Formula } from "@/lib/scoring/engine";

/* -------------------- Local fallbacks (if imports misbehave) -------------------- */
function _calcBattingPointsLocal(
  f: Formula["batting"],
  s: { runs: number; fours: number; sixes: number; balls: number; dismissal?: string }
) {
  if (!f) return 0;
  let pts =
    (s.runs ?? 0) * (f.per_run ?? 0) +
    (s.fours ?? 0) * (f.boundary_4 ?? 0) +
    (s.sixes ?? 0) * (f.boundary_6 ?? 0);
  for (const m of f.milestones ?? []) if ((s.runs ?? 0) >= (m.at ?? Infinity)) pts += m.bonus ?? 0;
  if ((s.runs ?? 0) === 0 && (s.balls ?? 0) > 0 && s.dismissal && s.dismissal !== "Did not bat") {
    pts += f.duck_penalty ?? 0;
  }
  return pts;
}
function _calcBowlingPointsLocal(
  f: Formula["bowling"],
  s: { overs: number; maidens: number; runs: number; wickets: number }
) {
  if (!f) return 0;
  let pts = (s.wickets ?? 0) * (f.per_wicket ?? 0) + (s.maidens ?? 0) * (f.maiden_over ?? 0);
  if ((f.three_for_bonus ?? 0) && (s.wickets ?? 0) >= 3) pts += f.three_for_bonus!;
  if ((f.five_for_bonus ?? 0) && (s.wickets ?? 0) >= 5) pts += f.five_for_bonus!;
  const econ = (s.overs ?? 0) > 0 ? (s.runs ?? 0) / (s.overs ?? 0) : undefined;
  if (econ !== undefined) {
    for (const b of f.economy_bands ?? []) {
      if (b.max !== undefined && econ <= b.max && (b.bonus ?? 0)) pts += b.bonus!;
      if (b.min !== undefined && econ >= b.min && (b.penalty ?? 0)) pts += b.penalty!;
    }
  }
  return pts;
}

/* -------------------- Defaults -------------------- */
const DEFAULTS: Formula = {
  batting: {
    per_run: 1,
    boundary_4: 1,
    boundary_6: 2,
    milestones: [
      { at: 50, bonus: 10 },
      { at: 100, bonus: 25 },
    ],
    duck_penalty: -10,
  },
  bowling: {
    per_wicket: 15,
    maiden_over: 5,
    three_for_bonus: 10,
    five_for_bonus: 25,
    economy_bands: [
      { max: 3, bonus: 10 },
      { min: 8, penalty: -10 },
    ],
  },
  fielding: {
    catch: 5,
    stumping: 8,
    runout: 6,
    drop_penalty: -5,
    misfield_penalty: -2,
  },
};

type EconRow = { mode: "≤" | "≥"; value: number; points: number };

export default function ScoringConfigPage() {
  const { user } = useAuthOptional(); // tolerant: won’t crash if provider missing
  const { clubId, seasonId } = useOrg();

  const [formula, setFormula] = useState<Formula>(DEFAULTS);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(JSON.stringify(DEFAULTS));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Demo inputs for live preview
  const [demoBat, setDemoBat] = useState({ runs: 72, balls: 55, fours: 10, sixes: 2, dismissal: "caught" as const });
  const [demoBowl, setDemoBowl] = useState({ overs: 8, maidens: 2, runs: 24, wickets: 3 });
  const [demoField, setDemoField] = useState({ catches: 2, stumpings: 0, runouts: 1, drops: 1, misfields: 0 });

  // key for localStorage scoping per org+season
  const LS_KEY = `mvp_scoring_formula:${clubId ?? "any"}:${seasonId ?? "any"}`;

  /* -------------------- Load: Supabase → localStorage → defaults -------------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (clubId && seasonId && user) {
          const { data, error } = await supabase
            .from("scoring_configs")
            .select("formula_json")
            .eq("club_id", clubId)
            .eq("season_id", seasonId)
            .eq("is_active", true)
            .order("effective_from", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!alive) return;

          if (!error && data?.formula_json) {
            const loaded = normaliseFormula(data.formula_json as Formula);
            setFormula(loaded);
            setSavedSnapshot(JSON.stringify(loaded));
            setLoading(false);
            return;
          }
        }
      } catch {
        // ignore and fall through to local
      }

      const raw = localStorage.getItem(LS_KEY) || localStorage.getItem("mvp_scoring_formula"); // legacy key
      if (raw) {
        try {
          const parsed = normaliseFormula(JSON.parse(raw));
          if (alive) {
            setFormula(parsed);
            setSavedSnapshot(JSON.stringify(parsed));
          }
        } catch {
          // ignore
        }
      }
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [clubId, seasonId, user?.id]);

  const dirty = useMemo(() => JSON.stringify(formula) !== savedSnapshot, [formula, savedSnapshot]);

  /* -------------------- Previews -------------------- */
  const batPts = useMemo(() => {
    const fn = (calcBattingPoints as any) || _calcBattingPointsLocal;
    const n = fn(formula.batting, demoBat);
    return Number.isFinite(n) ? n : 0;
  }, [formula.batting, demoBat]);

  const bowlPts = useMemo(() => {
    const fn = (calcBowlingPoints as any) || _calcBowlingPointsLocal;
    const n = fn(formula.bowling, demoBowl);
    return Number.isFinite(n) ? n : 0;
  }, [formula.bowling, demoBowl]);

  const fieldPts = useMemo(() => {
    const f = formula.fielding;
    const n =
      (demoField.catches ?? 0) * (f?.catch ?? 0) +
      (demoField.stumpings ?? 0) * (f?.stumping ?? 0) +
      (demoField.runouts ?? 0) * (f?.runout ?? 0) +
      (demoField.drops ?? 0) * (f?.drop_penalty ?? 0) +
      (demoField.misfields ?? 0) * (f?.misfield_penalty ?? 0);
    return Number.isFinite(n) ? n : 0;
  }, [formula.fielding, demoField]);

  const pie = useMemo(() => {
    const safe = Math.max(1, Math.max(0, batPts) + Math.max(0, bowlPts) + Math.max(0, fieldPts));
    return [
      { name: "Batting", value: Math.max(0, batPts) || 1 },
      { name: "Bowling", value: Math.max(0, bowlPts) || 1 },
      { name: "Fielding", value: Math.max(0, fieldPts) || 1 },
    ].map((d) => ({ ...d, pct: Math.round((d.value / safe) * 100) }));
  }, [batPts, bowlPts, fieldPts]);

  /* -------------------- Save (adds name, uses 32-bit-safe version) -------------------- */
  async function saveNewVersion() {
    setErr(null);
    setSaving(true);
    try {
      const now = new Date();
      const versionSec = Math.floor(now.getTime() / 1000); // fits INTEGER if your column is int
      const name = `v${now.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}`; // e.g., v20250827_1345

      if (user && clubId && seasonId) {
        const payload = {
          name,                // DB requires NOT NULL
          club_id: clubId,
          season_id: seasonId,
          version: versionSec, // avoids "out of range for type integer"
          is_active: true,
          formula_json: formula,
          created_by: user.id,
        };
        const { error } = await supabase.from("scoring_configs").insert(payload);
        if (error) throw error;
      } else {
        setErr("Saved locally. Sign in and set club + season to store this in the club database.");
      }

      localStorage.setItem(LS_KEY, JSON.stringify(formula));
      setSavedSnapshot(JSON.stringify(formula));
    } catch (e: any) {
      setErr(e?.message ?? "Could not save the config.");
    } finally {
      setSaving(false);
    }
  }

  function resetDefaults() {
    const f = normaliseFormula(DEFAULTS);
    setFormula(f);
  }

  const brand = (v: string) => `rgb(var(--brand-${v}))`;
  const canSave = !saving; // keep the button visible; dim while saving

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Scoring Engine</h1>
        {!dirty && !loading && (
          <span className="inline-flex items-center gap-1 text-sm text-text-soft">
            <Check size={16} /> Saved
          </span>
        )}
        {dirty && (
          <span className="inline-flex items-center gap-1 text-sm text-brand-800 bg-brand-100 px-2 py-1 rounded-lg">
            Unsaved changes
          </span>
        )}
        <div className="ml-auto flex gap-2">
          <button
            onClick={resetDefaults}
            className="px-3 py-2 rounded-xl border border-brand-200 bg-card hover:bg-brand-50 transition"
          >
            Reset to defaults
          </button>

          {/* Always-visible primary button - uses arbitrary color to bypass overridden utilities */}
          <button
            type="button"
            onClick={canSave ? saveNewVersion : undefined}
            aria-disabled={!canSave}
            title={!canSave ? "Saving…" : "Save a new version"}
            className="
              inline-flex items-center gap-2 px-3 py-2 rounded-xl text-white transition
              bg-[rgb(var(--brand-600))] hover:bg-[rgb(var(--brand-700))]
              focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))]
              aria-disabled:opacity-60 aria-disabled:pointer-events-none
            "
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            <span>Save new version</span>
          </button>
        </div>
      </div>

      {err && (
        <div className="inline-flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
          <AlertTriangle size={16} /> {err}
        </div>
      )}

      {/* Layout */}
      <div className="grid xl:grid-cols-[1.6fr_1fr] gap-4">
        {/* LEFT: Editor */}
        <div className="space-y-4">
          <Card title="Batting rules">
            <div className="grid md:grid-cols-2 gap-4">
              <NumberField
                label="Points per run"
                value={formula.batting.per_run}
                step={0.5}
                onChange={(v) => setFormula({ ...formula, batting: { ...formula.batting, per_run: v } })}
              />
              <NumberField
                label="Boundary 4 bonus"
                value={formula.batting.boundary_4}
                onChange={(v) => setFormula({ ...formula, batting: { ...formula.batting, boundary_4: v } })}
              />
              <NumberField
                label="Boundary 6 bonus"
                value={formula.batting.boundary_6}
                onChange={(v) => setFormula({ ...formula, batting: { ...formula.batting, boundary_6: v } })}
              />
              <NumberField
                label="Duck penalty"
                value={formula.batting.duck_penalty}
                onChange={(v) => setFormula({ ...formula, batting: { ...formula.batting, duck_penalty: v } })}
              />
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Milestones</h4>
              <MilestonesEditor
                rows={formula.batting.milestones || []}
                onChange={(rows) => setFormula({ ...formula, batting: { ...formula.batting, milestones: rows } })}
              />
            </div>
          </Card>

          <Card title="Bowling rules">
            <div className="grid md:grid-cols-2 gap-4">
              <NumberField
                label="Per wicket"
                value={formula.bowling.per_wicket}
                onChange={(v) => setFormula({ ...formula, bowling: { ...formula.bowling, per_wicket: v } })}
              />
              <NumberField
                label="Maiden over bonus"
                value={formula.bowling.maiden_over}
                onChange={(v) => setFormula({ ...formula, bowling: { ...formula.bowling, maiden_over: v } })}
              />
              <NumberField
                label="3-for bonus"
                value={formula.bowling.three_for_bonus || 0}
                onChange={(v) => setFormula({ ...formula, bowling: { ...formula.bowling, three_for_bonus: v } })}
              />
              <NumberField
                label="5-for bonus"
                value={formula.bowling.five_for_bonus || 0}
                onChange={(v) => setFormula({ ...formula, bowling: { ...formula.bowling, five_for_bonus: v } })}
              />
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Economy bands</h4>
              <EconBandsEditor
                rows={toEconRows(formula.bowling.economy_bands || [])}
                onChange={(rows) =>
                  setFormula({
                    ...formula,
                    bowling: { ...formula.bowling, economy_bands: fromEconRows(rows) },
                  })
                }
              />
            </div>
          </Card>

          <Card title="Fielding rules">
            <div className="grid md:grid-cols-2 gap-4">
              <NumberField
                label="Catch"
                value={formula.fielding.catch}
                onChange={(v) => setFormula({ ...formula, fielding: { ...formula.fielding, catch: v } })}
              />
              <NumberField
                label="Stumping"
                value={formula.fielding.stumping}
                onChange={(v) => setFormula({ ...formula, fielding: { ...formula.fielding, stumping: v } })}
              />
              <NumberField
                label="Run-out"
                value={formula.fielding.runout}
                onChange={(v) => setFormula({ ...formula, fielding: { ...formula.fielding, runout: v } })}
              />
              <NumberField
                label="Drop penalty"
                value={formula.fielding.drop_penalty}
                onChange={(v) => setFormula({ ...formula, fielding: { ...formula.fielding, drop_penalty: v } })}
              />
              <NumberField
                label="Misfield penalty"
                value={formula.fielding.misfield_penalty}
                onChange={(v) => setFormula({ ...formula, fielding: { ...formula.fielding, misfield_penalty: v } })}
              />
            </div>
          </Card>
        </div>

        {/* RIGHT: Previews */}
        <div className="space-y-4">
          <Card title="Live preview">
            <div className="grid grid-cols-3 gap-3">
              <StatCard title="Batting points" value={batPts} caption={`${demoBat.runs} (${demoBat.fours}x4, ${demoBat.sixes}x6)`} />
              <StatCard title="Bowling points" value={bowlPts} caption={`${demoBowl.overs}-${demoBowl.maidens}-${demoBowl.runs}-${demoBowl.wickets}`} />
              <StatCard title="Fielding points" value={fieldPts} caption={`${demoField.catches}c / ${demoField.runouts}ro / ${demoField.drops} drop`} />
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="rounded-2xl border border-brand-100 p-3">
                <h4 className="text-sm font-semibold mb-2">Category mix</h4>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={70} stroke="transparent">
                        <Cell fill={brand("600")} />
                        <Cell fill={brand("400")} />
                        <Cell fill={brand("200")} />
                      </Pie>
                      <Tooltip formatter={(v: any, n: any, p: any) => [`${v} pts (${p.payload.pct}%)`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 text-xs text-text-soft">Bat {pie[0].pct}% • Bowl {pie[1].pct}% • Field {pie[2].pct}%</div>
              </div>

              <div className="rounded-2xl border border-brand-100 p-3">
                <h4 className="text-sm font-semibold mb-2">Demo inputs</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <MiniNumber label="Runs" value={demoBat.runs} onChange={(v) => setDemoBat({ ...demoBat, runs: v })} />
                  <MiniNumber label="4s" value={demoBat.fours} onChange={(v) => setDemoBat({ ...demoBat, fours: v })} />
                  <MiniNumber label="6s" value={demoBat.sixes} onChange={(v) => setDemoBat({ ...demoBat, sixes: v })} />
                  <MiniNumber label="Overs" value={demoBowl.overs} step={0.1} onChange={(v) => setDemoBowl({ ...demoBowl, overs: v })} />
                  <MiniNumber label="Wkts" value={demoBowl.wickets} onChange={(v) => setDemoBowl({ ...demoBowl, wickets: v })} />
                  <MiniNumber label="RunsA" value={demoBowl.runs} onChange={(v) => setDemoBowl({ ...demoBowl, runs: v })} />
                  <MiniNumber label="Catches" value={demoField.catches} onChange={(v) => setDemoField({ ...demoField, catches: v })} />
                  <MiniNumber label="Run-outs" value={demoField.runouts} onChange={(v) => setDemoField({ ...demoField, runouts: v })} />
                  <MiniNumber label="Drops" value={demoField.drops} onChange={(v) => setDemoField({ ...demoField, drops: v })} />
                </div>
                <p className="text-xs text-text-soft mt-2">Adjust to see how points respond.</p>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Key rules</h4>
              <div className="flex flex-wrap gap-2">
                <Chip>{`+${formula.batting.per_run}/run`}</Chip>
                <Chip>{`4s +${formula.batting.boundary_4}`}</Chip>
                <Chip>{`6s +${formula.batting.boundary_6}`}</Chip>
                <Chip>{`Duck ${formula.batting.duck_penalty}`}</Chip>
                <Chip>{`Wicket +${formula.bowling.per_wicket}`}</Chip>
                <Chip>{`Maiden +${formula.bowling.maiden_over}`}</Chip>
                {formula.bowling.three_for_bonus ? <Chip>{`3-for +${formula.bowling.three_for_bonus}`}</Chip> : null}
                {formula.bowling.five_for_bonus ? <Chip>{`5-for +${formula.bowling.five_for_bonus}`}</Chip> : null}
                {(formula.bowling.economy_bands || []).map((b, i) => (
                  <Chip key={i}>{b.max !== undefined ? `Econ ≤ ${b.max}: +${b.bonus}` : `Econ ≥ ${b.min}: ${b.penalty}`}</Chip>
                ))}
                <Chip>{`Catch +${formula.fielding.catch}`}</Chip>
                <Chip>{`Stumping +${formula.fielding.stumping}`}</Chip>
                <Chip>{`Run-out +${formula.fielding.runout}`}</Chip>
              </div>
            </div>
          </Card>

          <Card title="How this works">
            <p className="text-sm text-text-soft">
              Tweak scoring with the controls. The preview updates instantly. When you’re happy, hit <span className="text-text-strong">Save new version</span>.
              We’ll store a versioned config for your club/season (or locally if you’re not signed in yet).
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* -------------------- UI bits -------------------- */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card rounded-2xl shadow-md border border-brand-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-brand-100"><h2 className="font-semibold">{title}</h2></div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function NumberField({
  label, value, onChange, min, max, step = 1,
}: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; }) {
  return (
    <label className="text-sm">
      <div className="text-text-soft mb-1">{label}</div>
      <input
        type="number" inputMode="decimal"
        className="w-full rounded-xl border border-brand-100 bg-card px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(safeNum(e.target.value))}
        min={min} max={max} step={step}
      />
    </label>
  );
}

function MiniNumber({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number; }) {
  return (
    <label className="text-xs">
      <div className="text-text-soft mb-1">{label}</div>
      <input
        type="number" inputMode="decimal"
        className="w-full rounded-lg border border-brand-100 bg-card px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-300"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(safeNum(e.target.value))}
        step={step}
      />
    </label>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-brand-100 text-brand-800 border border-brand-200">{children}</span>;
}

/* -------------------- Editors -------------------- */
function MilestonesEditor({
  rows, onChange,
}: { rows: { at: number; bonus: number }[]; onChange: (rows: { at: number; bonus: number }[]) => void; }) {
  const add = () => onChange([...rows, { at: 25, bonus: 5 }].sort((a, b) => a.at - b.at));
  const remove = (idx: number) => onChange(rows.filter((_, i) => i !== idx));
  const set = (idx: number, patch: Partial<{ at: number; bonus: number }>) =>
    onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)).sort((a, b) => a.at - b.at));

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 rounded-xl border border-brand-100 p-2">
          <NumberField label="At (runs)" value={r.at} onChange={(v) => set(i, { at: Math.max(0, Math.floor(v)) })} />
          <NumberField label="Bonus points" value={r.bonus} onChange={(v) => set(i, { bonus: Math.floor(v) })} />
          <button onClick={() => remove(i)} className="h-10 inline-flex items-center justify-center rounded-xl border border-brand-100 px-3 hover:bg-brand-50" aria-label="Remove milestone">
            <X size={16} />
          </button>
        </div>
      ))}
      <button onClick={add} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-brand-200 hover:bg-brand-50"><Plus size={16} /> Add milestone</button>
    </div>
  );
}

function EconBandsEditor({ rows, onChange }: { rows: EconRow[]; onChange: (rows: EconRow[]) => void; }) {
  const add = () => onChange([...rows, { mode: "≤", value: 3, points: 10 }]);
  const remove = (idx: number) => onChange(rows.filter((_, i) => i !== idx));
  const set = (idx: number, patch: Partial<EconRow>) => onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[90px_1fr_1fr_auto] items-end gap-2 rounded-xl border border-brand-100 p-2">
          <label className="text-sm">
            <div className="text-text-soft mb-1">Condition</div>
            <select
              className="w-full rounded-xl border border-brand-100 bg-card px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
              value={r.mode}
              onChange={(e) => set(i, { mode: e.target.value as "≤" | "≥" })}
            >
              <option value="≤">Econ ≤</option>
              <option value="≥">Econ ≥</option>
            </select>
          </label>
          <NumberField label="Runs per over" value={r.value} step={0.1} onChange={(v) => set(i, { value: v })} />
          <NumberField label="Points" value={r.points} onChange={(v) => set(i, { points: Math.floor(v) })} />
          <button onClick={() => remove(i)} className="h-10 inline-flex items-center justify-center rounded-xl border border-brand-100 px-3 hover:bg-brand-50" aria-label="Remove band">
            <X size={16} />
          </button>
        </div>
      ))}
      <button onClick={add} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-brand-200 hover:bg-brand-50"><Plus size={16} /> Add band</button>
    </div>
  );
}

/* -------------------- helpers -------------------- */
function safeNum(v: string): number { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function toEconRows(bands: NonNullable<Formula["bowling"]["economy_bands"]>): EconRow[] {
  return bands.map((b) =>
    b.max !== undefined ? { mode: "≤", value: b.max, points: b.bonus ?? 0 } : { mode: "≥", value: b.min ?? 0, points: b.penalty ?? 0 }
  );
}
function fromEconRows(rows: EconRow[]): NonNullable<Formula["bowling"]["economy_bands"]> {
  return rows.map((r) => (r.mode === "≤" ? { max: r.value, bonus: r.points } : { min: r.value, penalty: r.points }));
}
function normaliseFormula(f: Formula): Formula {
  return {
    batting: {
      per_run: f?.batting?.per_run ?? 1,
      boundary_4: f?.batting?.boundary_4 ?? 1,
      boundary_6: f?.batting?.boundary_6 ?? 2,
      milestones: f?.batting?.milestones ?? [],
      duck_penalty: f?.batting?.duck_penalty ?? -10,
    },
    bowling: {
      per_wicket: f?.bowling?.per_wicket ?? 15,
      maiden_over: f?.bowling?.maiden_over ?? 5,
      three_for_bonus: f?.bowling?.three_for_bonus ?? 0,
      five_for_bonus: f?.bowling?.five_for_bonus ?? 0,
      economy_bands: f?.bowling?.economy_bands ?? [],
    },
    fielding: {
      catch: f?.fielding?.catch ?? 5,
      stumping: f?.fielding?.stumping ?? 8,
      runout: f?.fielding?.runout ?? 6,
      drop_penalty: f?.fielding?.drop_penalty ?? -5,
      misfield_penalty: f?.fielding?.misfield_penalty ?? -2,
    },
  };
}

/* -------------------- Stat card -------------------- */
function StatCard({ title, value, caption }: { title: string; value: number; caption?: string; }) {
  const display = Number.isFinite(value) ? Math.round(value) : "—";
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
      <div className="text-xs text-text-soft">{title}</div>
      <div className="text-2xl font-bold">{display}</div>
      {caption && <div className="text-xs text-text-soft mt-1">{caption}</div>}
    </div>
  );
}
