// src/pages/admin/PlayCricketIntegrationPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Link as LinkIcon,
  Settings2,
  Cloud,
  RefreshCw,
  Check,
  AlertTriangle,
  ExternalLink,
  Plus,
  X,
  Shield,
  Save,
  Copy,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthOptional } from "@/context/auth-context";
import { useOrg } from "@/context/OrgContext";

/** ---------------- Types ---------------- */
type PcSettings = {
  clubHomeUrl: string;
  fixturesUrl?: string;
  resultsUrl?: string;
  apiKey?: string;
};
type MappingRow = { external: string; team: string };

type InviteRow = {
  id: string;
  email: string;
  role: string | null;
  token: string | null;
  created_at: string | null;
  consumed_at: string | null;
  expires_at: string | null;
  // derived on client
  _status?: "pending" | "accepted" | "expired";
};

const DEFAULT_SETTINGS: PcSettings = {
  clubHomeUrl: "",
  fixturesUrl: "",
  resultsUrl: "",
  apiKey: "",
};

const INVITE_EXPIRY_DAYS = 14;

/** ---------------- Page ---------------- */
export default function PlayCricketIntegrationPage() {
  const { user } = useAuthOptional();
  const { clubId, seasonId } = useOrg();

  const [settings, setSettings] = useState<PcSettings>(DEFAULT_SETTINGS);
  const [mappings, setMappings] = useState<MappingRow[]>([
    { external: "1st XI", team: "Mens 1st XI" },
    { external: "2nd XI", team: "Mens 2nd XI" },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // invites
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("org_member");
  const [inviteBusy, setInviteBusy] = useState(false);

  const LS_KEY_SETTINGS = `pc_admin:settings:${clubId ?? "any"}:${seasonId ?? "any"}`;
  const LS_KEY_MAPPINGS = `pc_admin:mappings:${clubId ?? "any"}:${seasonId ?? "any"}`;

  /** ---------- Load: Supabase -> localStorage -> defaults ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        if (user && clubId && seasonId) {
          const { data, error } = await supabase
            .from("play_cricket_settings")
            .select("settings_json, mappings_json")
            .eq("club_id", clubId)
            .eq("season_id", seasonId)
            .eq("is_active", true)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) throw error;
          if (data) {
            const s = normalizeSettings((data.settings_json ?? {}) as PcSettings);
            const m = normalizeMappings((data.mappings_json ?? []) as MappingRow[]);
            if (alive) {
              setSettings(s);
              setMappings(m);
            }
          }
        }
      } catch {
        // fall through to local
      }

      try {
        const rawS = localStorage.getItem(LS_KEY_SETTINGS);
        const rawM = localStorage.getItem(LS_KEY_MAPPINGS);
        if (rawS) setSettings(normalizeSettings(JSON.parse(rawS)));
        if (rawM) setMappings(normalizeMappings(JSON.parse(rawM)));
      } catch { /* ignore */ }

      setLoading(false);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, clubId, seasonId]);

  // Load invites whenever org changes
  useEffect(() => {
    if (clubId) loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  const canSaveToDb = !!(user && clubId && seasonId);

  /** ---------- Actions: settings/mappings ---------- */
  async function saveAll() {
    setErr(null);
    setOk(null);
    setSaving(true);
    try {
      // persist local (always)
      localStorage.setItem(LS_KEY_SETTINGS, JSON.stringify(settings));
      localStorage.setItem(LS_KEY_MAPPINGS, JSON.stringify(mappings));

      // DB if scoped + authed
      if (canSaveToDb) {
        const payload = {
          club_id: clubId,
          season_id: seasonId,
          is_active: true,
          settings_json: settings,
          mappings_json: mappings,
          updated_by: user!.id,
        };
        const { error } = await supabase.from("play_cricket_settings").insert(payload);
        if (error) throw error;
        setOk("Saved to database.");
      } else {
        setOk("Saved locally. Sign in and set club + season to save in the club database.");
      }
    } catch (e: any) {
      setErr(e?.message ?? "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  function addRow() {
    setMappings((m) => [...m, { external: "", team: "" }]);
  }
  function removeRow(idx: number) {
    setMappings((m) => m.filter((_, i) => i !== idx));
  }
  function setRow(idx: number, patch: Partial<MappingRow>) {
    setMappings((m) => m.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  /** ---------- Invites (no 'status' column required) ---------- */
  async function loadInvites() {
    if (!clubId) return;
    try {
      const { data, error } = await supabase
        .from("org_invites")
        .select("id,email,role,token,created_at,consumed_at,expires_at")
        .eq("club_id", clubId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []).map((r: InviteRow) => ({
        ...r,
        _status: deriveStatus(r),
      }));
      setInvites(rows);
    } catch (e: any) {
      setErr(e?.message ?? "Could not load invites.");
    }
  }

  async function createInvite() {
    if (!clubId || !inviteEmail) return;
    setInviteBusy(true);
    setErr(null);
    try {
      const token = generateToken();
      const expires_at = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const payload = {
        club_id: clubId,
        email: inviteEmail.trim(),
        role: inviteRole,
        token,
        expires_at,
      };
      const { error } = await supabase.from("org_invites").insert(payload);
      if (error) throw error;

      setInviteEmail("");
      await loadInvites();
    } catch (e: any) {
      setErr(e?.message ?? "Could not create invite.");
    } finally {
      setInviteBusy(false);
    }
  }

  async function resendInvite(inv: InviteRow) {
    if (!inv?.id) return;
    setInviteBusy(true);
    setErr(null);
    try {
      const token = generateToken();
      const expires_at = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from("org_invites")
        .update({ token, expires_at })
        .eq("id", inv.id);
      if (error) throw error;
      await loadInvites();
      alert("Invite refreshed. Use 'Copy link' to send it.");
    } catch (e: any) {
      setErr(e?.message ?? "Could not resend invite.");
    } finally {
      setInviteBusy(false);
    }
  }

  async function cancelInvite(inv: InviteRow) {
    if (!inv?.id) return;
    setInviteBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.from("org_invites").delete().eq("id", inv.id);
      if (error) throw error;
      await loadInvites();
    } catch (e: any) {
      setErr(e?.message ?? "Could not cancel invite.");
    } finally {
      setInviteBusy(false);
    }
  }

  function copyInviteLink(inv: InviteRow) {
    if (!inv?.token) return alert("No token on this invite.");
    const url = `${location.origin}/accept?token=${encodeURIComponent(inv.token)}`;
    navigator.clipboard?.writeText(url).then(
      () => alert("Invite link copied to clipboard."),
      () => alert(url) // fallback: show it
    );
  }

  /** ---------- Derived ---------- */
  const clubDomain = useMemo(() => {
    try {
      if (!settings.clubHomeUrl) return "";
      const u = new URL(settings.clubHomeUrl);
      return u.host || "";
    } catch { return ""; }
  }, [settings.clubHomeUrl]);

  return (
    <div className="space-y-6">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[rgb(var(--brand-700))] via-[rgb(var(--brand-600))] to-[rgb(var(--brand-400))]" />
        <div className="relative p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-end gap-5 md:gap-8">
            <div className="flex-1 space-y-2">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm backdrop-blur-sm"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <Cloud size={16} />
                <span>Play-Cricket Integration</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
                Play-Cricket Admin
              </h1>
              <p className="text-white/85 max-w-2xl">
                Connect your club pages, map teams, and trigger imports. Settings are stored per club &amp; season.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <a
                  href={settings.clubHomeUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 border border-white/40 text-white hover:bg-white/10"
                >
                  <LinkIcon size={18} />
                  Open club site <ExternalLink size={16} className="opacity-80" />
                </a>
                <button
                  type="button"
                  onClick={saveAll}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 bg-white text-[rgb(var(--brand-700))] hover:bg-white/90 disabled:opacity-60"
                >
                  {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                  Save
                </button>
            </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:w-auto w-full">
              <Kpi label="Scope" value={clubId ? "Club set" : "No club"} icon={Shield} />
              <Kpi label="Season" value={seasonId ? "Active" : "Unset"} icon={Settings2} />
            </div>
          </div>
        </div>
      </section>

      {err ? (
        <Note tone="error" icon={<AlertTriangle size={16} />}>
          {err}
        </Note>
      ) : null}
      {ok ? (
        <Note tone="success" icon={<Check size={16} />}>
          {ok}
        </Note>
      ) : null}

      {loading ? (
        <div className="p-6">Loading Play-Cricket settings…</div>
      ) : (
        <>
          {/* GRID */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Connection */}
            <Card title="Connection">
              <div className="grid gap-4">
                <Field
                  label="Club homepage URL"
                  placeholder="https://yourclub.play-cricket.com/home"
                  value={settings.clubHomeUrl}
                  onChange={(v) => setSettings({ ...settings, clubHomeUrl: v })}
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <Field
                    label="Fixtures URL (optional)"
                    placeholder="https://yourclub.play-cricket.com/Matches?tab=Fixture"
                    value={settings.fixturesUrl ?? ""}
                    onChange={(v) => setSettings({ ...settings, fixturesUrl: v })}
                  />
                  <Field
                    label="Results URL (optional)"
                    placeholder="https://yourclub.play-cricket.com/Matches?tab=Results"
                    value={settings.resultsUrl ?? ""}
                    onChange={(v) => setSettings({ ...settings, resultsUrl: v })}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <A href={settings.clubHomeUrl} label="Open Club" />
                  {settings.fixturesUrl ? <A href={settings.fixturesUrl} label="Fixtures" /> : null}
                  {settings.resultsUrl ? <A href={settings.resultsUrl} label="Results" /> : null}
                  {clubDomain ? (
                    <span className="inline-flex items-center gap-2 text-xs text-text-soft ml-auto">
                      <LinkIcon size={14} /> {clubDomain}
                    </span>
                  ) : null}
                </div>
              </div>
            </Card>

            {/* Import */}
            <Card title="Import & Sync">
              <div className="grid md:grid-cols-2 gap-3">
                <ActionButton icon={<RefreshCw size={16} />} label="Sync now" onClick={() => toastSoon()} />
                <ActionButton icon={<Cloud size={16} />} label="Fetch fixtures" onClick={() => toastSoon()} />
                <ActionButton icon={<Cloud size={16} />} label="Fetch results" onClick={() => toastSoon()} />
                <ActionButton icon={<Settings2 size={16} />} label="Configure job" onClick={() => toastSoon()} />
              </div>
              <p className="text-xs text-text-soft mt-3">
                Wire these to Supabase Functions or a server endpoint when you’re ready.
              </p>
            </Card>

            {/* Team mappings */}
            <Card title="Team mappings">
              <p className="text-sm text-text-soft mb-3">
                Map Play-Cricket team names to your club teams for cleaner imports.
              </p>
              <div className="space-y-2">
                {mappings.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 rounded-xl border border-brand-100 p-2">
                    <Field
                      small
                      label="Play-Cricket team"
                      placeholder="e.g. 1st XI"
                      value={row.external}
                      onChange={(v) => setRow(i, { external: v })}
                    />
                    <Field
                      small
                      label="Your team name"
                      placeholder="e.g. Mens 1st XI"
                      value={row.team}
                      onChange={(v) => setRow(i, { team: v })}
                    />
                    <button
                      onClick={() => removeRow(i)}
                      className="h-10 inline-flex items-center justify-center rounded-xl border border-brand-100 px-3 hover:bg-brand-50"
                      aria-label="Remove mapping"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addRow}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-brand-200 hover:bg-brand-50"
                >
                  <Plus size={16} /> Add mapping
                </button>
              </div>
            </Card>
          </div>

          {/* Invites */}
          <Card title="Invites">
            <div className="grid md:grid-cols-[1.4fr_0.8fr_auto] gap-2">
              <Field
                label="Email"
                value={inviteEmail}
                onChange={setInviteEmail}
                placeholder="captain@example.com"
              />
              <label className="text-sm">
                <div className="text-text-soft mb-1">Role</div>
                <select
                  className="w-full rounded-xl border border-brand-100 bg-card px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="org_member">Member</option>
                  <option value="org_admin">Admin</option>
                  <option value="org_owner">Owner</option>
                </select>
              </label>
              <button
                onClick={createInvite}
                disabled={!inviteEmail || !clubId || inviteBusy}
                className="self-end inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2 hover:bg-brand-50 disabled:opacity-60"
              >
                <Plus size={16} /> Invite
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-soft">
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Role</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Created</th>
                    <th className="py-2 pr-3">Expires</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((inv) => (
                    <tr key={inv.id} className="border-t border-brand-100">
                      <td className="py-2 pr-3">{inv.email}</td>
                      <td className="py-2 pr-3">{inv.role ?? "—"}</td>
                      <td className="py-2 pr-3">
                        <StatusPill status={inv._status ?? "pending"} />
                      </td>
                      <td className="py-2 pr-3">{formatDate(inv.created_at)}</td>
                      <td className="py-2 pr-3">{formatDate(inv.expires_at)}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="inline-flex items-center gap-1 rounded-lg border border-brand-200 px-2 py-1 hover:bg-brand-50"
                            onClick={() => copyInviteLink(inv)}
                            title="Copy invite link"
                          >
                            <Copy size={14} /> Copy
                          </button>
                          <button
                            className="inline-flex items-center gap-1 rounded-lg border border-brand-200 px-2 py-1 hover:bg-brand-50"
                            onClick={() => resendInvite(inv)}
                            disabled={inviteBusy}
                            title="Resend / refresh"
                          >
                            <RefreshCw size={14} /> Resend
                          </button>
                          <button
                            className="inline-flex items-center gap-1 rounded-lg border border-brand-200 px-2 py-1 hover:bg-red-50"
                            onClick={() => cancelInvite(inv)}
                            disabled={inviteBusy}
                            title="Cancel invite"
                          >
                            <X size={14} /> Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!invites.length && (
                    <tr className="border-t border-brand-100">
                      <td className="py-3 text-text-soft" colSpan={6}>
                        No invites yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Sticky save bar */}
          <div className="sticky bottom-4 flex justify-end">
            <button
              onClick={saveAll}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5
                         bg-[rgb(var(--brand-600))] text-white hover:bg-[rgb(var(--brand-700))]
                         disabled:opacity-60 shadow-sm"
            >
              {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
              Save changes
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** ---------------- UI primitives ---------------- */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl shadow-md border border-brand-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-brand-100 flex items-center gap-2">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  small = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  small?: boolean;
}) {
  return (
    <label className={small ? "text-xs" : "text-sm"}>
      <div className="text-text-soft mb-1">{label}</div>
      <input
        className={[
          "w-full rounded-xl border border-brand-100 bg-card px-3 py-2",
          "focus:outline-none focus:ring-2 focus:ring-brand-300",
          small ? "py-2" : "",
        ].join(" ")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Kpi({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<any> }) {
  const Ico = Icon ?? Check;
  return (
    <div className="rounded-2xl border border-white/25 bg-white/15 text-white p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-wide text-white/85">{label}</div>
        <Ico size={16} className="opacity-90" />
      </div>
      <div className="mt-1 text-xl font-extrabold">{value}</div>
    </div>
  );
}

function ActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2
                 hover:bg-brand-50/50 transition"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Note({ tone, icon, children }: { tone: "error" | "success"; icon: React.ReactNode; children: React.ReactNode }) {
  const cls =
    tone === "error"
      ? "text-red-700 bg-red-50 border-red-200"
      : "text-green-700 bg-green-50 border-green-200";
  return (
    <div className={`inline-flex items-center gap-2 text-sm border px-3 py-2 rounded-xl ${cls}`}>
      {icon}
      <span>{children}</span>
    </div>
  );
}

function A({ href, label }: { href?: string; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-brand-100 bg-white px-3 py-2 text-sm hover:bg-brand-50/40"
    >
      {label} <ExternalLink size={14} className="opacity-80" />
    </a>
  );
}

function StatusPill({ status }: { status: NonNullable<InviteRow["_status"]> }) {
  const map: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    expired: "bg-gray-50 text-gray-700 border-gray-200",
    accepted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs ${map[status]}`}>
      {status}
    </span>
  );
}

/** ---------------- helpers ---------------- */
function normalizeSettings(s: PcSettings): PcSettings {
  return {
    clubHomeUrl: s?.clubHomeUrl ?? "",
    fixturesUrl: s?.fixturesUrl ?? "",
    resultsUrl: s?.resultsUrl ?? "",
    apiKey: s?.apiKey ?? "",
  };
}
function normalizeMappings(m: MappingRow[]): MappingRow[] {
  return (m ?? []).map((r) => ({ external: r?.external ?? "", team: r?.team ?? "" }));
}
function toastSoon() {
  alert("Hook this up to your import job or Edge Function.");
}
function deriveStatus(inv: InviteRow): NonNullable<InviteRow["_status"]> {
  if (inv.consumed_at) return "accepted";
  const exp = inv.expires_at ? Date.parse(inv.expires_at) : NaN;
  if (!Number.isNaN(exp) && exp < Date.now()) return "expired";
  return "pending";
}
function generateToken(len = 32) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}
