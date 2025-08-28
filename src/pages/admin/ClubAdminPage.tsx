// src/pages/admin/ClubAdminPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  Shield,
  Users as UsersIcon,
  CreditCard,
  Check,
  AlertTriangle,
  ExternalLink,
  Plus,
  X,
  Save,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuthOptional } from "@/context/auth-context";
import { useOrg } from "@/context/OrgContext";

/* -------------------------------------------------------------------------- */
/*                               Helper typings                                */
/* -------------------------------------------------------------------------- */

type BrandLike =
  | string
  | { primary?: string; secondary?: string; hex?: string; logo_url?: string }
  | null
  | undefined;

type ClubRow = {
  id: string;
  name: string | null;
  brand: BrandLike;
  brand_secondary: BrandLike;
  logo_path: string | null;
  billing_status: string | null;
};

type MemberRow = { id: string; user_id: string; role: string; created_at: string };

type InviteRow = { id: string; email: string; role: string; status?: string | null; created_at: string };

/* -------------------------------------------------------------------------- */
/*                              Helper functions                               */
/* -------------------------------------------------------------------------- */

function toHex(v: BrandLike, fallback = ""): string {
  if (!v) return fallback;
  if (typeof v === "string") return v;
  return v.primary ?? v.secondary ?? v.hex ?? fallback;
}

function toLogoUrlFromBrand(v: BrandLike): string | undefined {
  if (!v || typeof v === "string") return undefined;
  return v.logo_url;
}

function extOf(filename: string) {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot) : "";
}

async function ensureBucket(bucket: string) {
  // Try list first; if not there, create.
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === bucket)) return;
  await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
  });
}

function publicUrl(bucket: string, path?: string | null) {
  if (!path) return "";
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/* -------------------------------------------------------------------------- */
/*                                UI components                                */
/* -------------------------------------------------------------------------- */

function Note({
  tone,
  children,
  icon,
}: {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const cls =
    tone === "error"
      ? "text-red-700 bg-red-50 border-red-200"
      : tone === "success"
      ? "text-green-700 bg-green-50 border-green-200"
      : "text-sky-700 bg-sky-50 border-sky-200";
  return (
    <div className={`inline-flex items-center gap-2 text-sm border px-3 py-2 rounded-xl ${cls}`}>
      {icon}
      <span>{children}</span>
    </div>
  );
}

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

function Kpi({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ComponentType<any>;
}) {
  const Ico = Icon ?? Check;
  return (
    <div className="rounded-2xl border border-white/25 bg-white/15 text-white p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs uppercase tracking-wide text-white/85">{label}</div>
        <Ico size={16} className="opacity-90" />
      </div>
      <div className="mt-1 text-xl font-extrabold">{String(value)}</div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <label className="text-sm">
      <div className="text-text-soft mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded border border-brand-100"
          aria-label={label}
        />
        <input
          className="w-36 rounded-xl border border-brand-100 bg-card px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 font-mono"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
        />
      </div>
    </label>
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

/* -------------------------------------------------------------------------- */
/*                                Main component                               */
/* -------------------------------------------------------------------------- */

const BUCKET = "club-assets";

export default function ClubAdminPage() {
  const { user } = useAuthOptional();
  const { clubId } = useOrg();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [bucketOk, setBucketOk] = useState<boolean | null>(null);

  // Normalised club state (always strings for UI)
  const [clubName, setClubName] = useState("");
  const [brandHex, setBrandHex] = useState("#0ea5e9");
  const [brandSecondaryHex, setBrandSecondaryHex] = useState("#22d3ee");
  const [billingStatus, setBillingStatus] = useState("unknown");
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const logoUrl = useMemo(() => publicUrl(BUCKET, logoPath), [logoPath]);

  // Members (optional)
  const [members, setMembers] = useState<MemberRow[] | null>(null);
  const [membersNote, setMembersNote] = useState<string | null>(null);

  // Invites (optional)
  const [invites, setInvites] = useState<InviteRow[] | null>(null);
  const [invitesNote, setInvitesNote] = useState<string | null>(null);
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [newInviteRole, setNewInviteRole] = useState("org_member");

  /* ----------------------------- Initial loading ---------------------------- */

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);
      setErr(null);
      setOk(null);

      try {
        // Bucket probe (so we can show a banner if it's missing)
        try {
          const { data: buckets } = await supabase.storage.listBuckets();
          setBucketOk((buckets ?? []).some((b) => b.name === BUCKET));
        } catch {
          setBucketOk(null);
        }

        if (!clubId) {
          setLoading(false);
          return;
        }

        // Load club
        const { data, error } = await supabase
          .from("clubs")
          .select("id,name,brand,brand_secondary,logo_path,billing_status")
          .eq("id", clubId)
          .maybeSingle<ClubRow>();

        if (error) throw error;

        const brandFromDb = toHex(data?.brand, "#0ea5e9");
        const brand2FromDb = toHex(data?.brand_secondary, "#22d3ee");
        const logoFromBrand = toLogoUrlFromBrand(data?.brand);

        if (alive) {
          setClubName(data?.name ?? "");
          setBrandHex(brandFromDb);
          setBrandSecondaryHex(brand2FromDb);
          setBillingStatus(data?.billing_status ?? "unknown");
          setLogoPath(data?.logo_path ?? null);

          // If no explicit logo_path but brand JSON had logo_url, keep the preview only
          if (!data?.logo_path && logoFromBrand) {
            // We won't persist external URLs in logo_path; user can upload if needed.
          }
        }

        // Load members (best effort; tolerate schema differences)
        try {
          let m: MemberRow[] | null = null;

          // Try org_id first
          const q1 = await supabase
            .from("user_org_roles")
            .select("id,user_id,role,created_at")
            .eq("org_id", clubId);

          if (q1.error) {
            // Try club_id fallback
            const q2 = await supabase
              .from("user_org_roles")
              .select("id,user_id,role,created_at")
              .eq("club_id", clubId);
            if (q2.error) throw q2.error;
            m = q2.data as MemberRow[];
          } else {
            m = q1.data as MemberRow[];
          }

          if (alive) setMembers(m ?? []);
        } catch (e: any) {
          setMembers([]);
          setMembersNote("The user_org_roles table/columns weren’t found. Showing an empty list for now.");
        }

        // Load invites (optional table)
        try {
          let inv: InviteRow[] | null = null;
          const r1 = await supabase
            .from("org_invites")
            .select("id,email,role,status,created_at")
            .eq("org_id", clubId)
            .order("created_at", { ascending: false });

          if (r1.error) {
            const r2 = await supabase
              .from("org_invites")
              .select("id,email,role,status,created_at")
              .eq("club_id", clubId)
              .order("created_at", { ascending: false });
            if (r2.error) throw r2.error;
            inv = r2.data as InviteRow[];
          } else {
            inv = r1.data as InviteRow[];
          }
          if (alive) setInvites(inv ?? []);
        } catch {
          setInvites([]);
          setInvitesNote("The org_invites table wasn’t found. You can add it later.");
        }
      } catch (e: any) {
        setErr(e?.message ?? "Could not load club details.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [clubId]);

  /* ------------------------------ Save branding ----------------------------- */

  async function saveBranding() {
    if (!clubId) return;
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      const payload = {
        name: clubName,
        // Persist as strings; UI never renders objects.
        brand: brandHex,
        brand_secondary: brandSecondaryHex,
        logo_path: logoPath, // may be null
      };
      const { error } = await supabase.from("clubs").update(payload).eq("id", clubId);
      if (error) throw error;
      setOk("Branding saved.");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save branding.");
    } finally {
      setSaving(false);
    }
  }

  /* -------------------------------- Logo upload ----------------------------- */

  async function onLogoPick(e: React.ChangeEvent<HTMLInputElement>) {
    if (!clubId) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErr(null);
    setOk(null);
    try {
      await ensureBucket(BUCKET);
      setBucketOk(true);

      const path = `${clubId}/logo-${Date.now()}${extOf(file.name) || ".png"}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          upsert: true,
          cacheControl: "3600",
          contentType: file.type,
        });
      if (upErr) throw upErr;

      // Persist path on the club
      const { error: updErr } = await supabase.from("clubs").update({ logo_path: path }).eq("id", clubId);
      if (updErr) throw updErr;

      setLogoPath(path);
      setOk("Logo uploaded.");
    } catch (e: any) {
      setErr(e?.message ?? "Logo upload failed.");
    } finally {
      setUploading(false);
      // reset input so picking same file again still triggers change
      e.currentTarget.value = "";
    }
  }

  /* --------------------------------- Invites -------------------------------- */

  async function sendInvite() {
    if (!clubId || !newInviteEmail) return;
    try {
      setErr(null);
      setOk(null);
      // Try org_id first; fall back to club_id
      let { error } = await supabase
        .from("org_invites")
        .insert({ org_id: clubId, email: newInviteEmail, role: newInviteRole, status: "pending" });
      if (error) {
        const r2 = await supabase
          .from("org_invites")
          .insert({ club_id: clubId, email: newInviteEmail, role: newInviteRole, status: "pending" });
        if (r2.error) throw r2.error;
      }
      setNewInviteEmail("");
      setOk("Invite created.");
      // refresh list
      const r = await supabase
        .from("org_invites")
        .select("id,email,role,status,created_at")
        .or(`org_id.eq.${clubId},club_id.eq.${clubId}`)
        .order("created_at", { ascending: false });
      if (!r.error) setInvites(r.data as InviteRow[]);
    } catch (e: any) {
      setErr(e?.message ?? "Could not create invite.");
    }
  }

  async function updateInvite(id: string, patch: Partial<InviteRow>) {
    try {
      // Try org_id version
      let { error } = await supabase.from("org_invites").update(patch).eq("id", id);
      if (error) throw error;
      setInvites((xs) => (xs ? xs.map((i) => (i.id === id ? { ...i, ...patch } : i)) : xs));
    } catch (e: any) {
      setErr(e?.message ?? "Could not update invite.");
    }
  }

  /* --------------------------------- Derived -------------------------------- */

  const membersCount = members?.length ?? 0;

  /* ---------------------------------- Render -------------------------------- */

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
                <Shield size={16} />
                <span>Club Admin</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">Your Club</h1>
              <p className="text-white/85 max-w-2xl">
                Configure your club branding, upload a logo, manage members & invites, and view billing
                status.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:w-auto w-full">
              <Kpi label="Primary" value={brandHex || "—"} icon={ImageIcon} />
              <Kpi label="Secondary" value={brandSecondaryHex || "—"} icon={ImageIcon} />
              <Kpi label="Billing" value={billingStatus || "unknown"} icon={CreditCard} />
              <Kpi label="Members" value={membersCount} icon={UsersIcon} />
            </div>

            <div className="flex items-center gap-3 md:ml-4">
              <div className="relative w-11 h-11 rounded-xl border border-white/40 bg-white/10 grid place-items-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Club logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon size={18} className="opacity-90" />
                )}
              </div>
              <label className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 border border-white/40 text-white hover:bg-white/10 cursor-pointer">
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                <span>Upload logo</span>
                <input type="file" accept="image/*" className="hidden" onChange={onLogoPick} />
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* BANNERS */}
      {bucketOk === false && (
        <Note tone="info" icon={<AlertTriangle size={16} />}>
          Bucket not found. We’ll create it automatically on the first upload.
        </Note>
      )}
      {err && (
        <Note tone="error" icon={<AlertTriangle size={16} />}>
          {err}
        </Note>
      )}
      {ok && (
        <Note tone="success" icon={<Check size={16} />}>
          {ok}
        </Note>
      )}

      {/* GRID */}
      <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-4">
        {/* Branding */}
        <Card title="Branding">
          {loading ? (
            <div className="py-6 text-sm text-text-soft">Loading…</div>
          ) : (
            <>
              <div className="grid gap-4">
                <Field
                  label="Club name"
                  placeholder="e.g. Wombles CC"
                  value={clubName}
                  onChange={setClubName}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <ColorField label="Primary colour" value={brandHex} onChange={setBrandHex} />
                  <ColorField
                    label="Secondary colour"
                    value={brandSecondaryHex}
                    onChange={setBrandSecondaryHex}
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={saveBranding}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 bg-[rgb(var(--brand-600))] text-white hover:bg-[rgb(var(--brand-700))] disabled:opacity-60"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save branding
                </button>
              </div>
            </>
          )}
        </Card>

        {/* Billing (placeholder – hooks in later via Stripe webhooks) */}
        <Card title="Billing">
          <p className="text-sm text-text-soft">
            Current status: <span className="font-medium text-gray-900">{billingStatus}</span>
          </p>
          <p className="text-xs text-text-soft mt-2">
            Stripe hooks will update this automatically when checkout completes or renews.
          </p>
        </Card>

        {/* Members & Roles */}
        <Card title="Members & Roles">
          {membersNote ? (
            <p className="text-xs text-text-soft mb-3">{membersNote}</p>
          ) : null}
          {members && members.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-soft">
                    <th className="py-2 pr-3">User</th>
                    <th className="py-2 pr-3">Role</th>
                    <th className="py-2">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-t border-brand-100">
                      <td className="py-2 pr-3 font-mono text-xs">{m.user_id}</td>
                      <td className="py-2 pr-3">{m.role}</td>
                      <td className="py-2 text-xs text-text-soft">
                        {new Date(m.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-text-soft">
              No members found for this club yet.
              <br />
              This list reads from <code className="font-mono">user_org_roles</code>. If you keep a
              separate <code className="font-mono">profiles</code> table, you can join for
              names/emails later.
            </p>
          )}
        </Card>

        {/* Invites (optional table) */}
        <Card title="Invites">
          {invitesNote ? (
            <p className="text-xs text-text-soft">{invitesNote}</p>
          ) : (
            <>
              <div className="grid md:grid-cols-[1fr_160px_auto] gap-2 mb-3">
                <Field
                  small
                  label="Email"
                  value={newInviteEmail}
                  onChange={setNewInviteEmail}
                  placeholder="name@example.com"
                />
                <label className="text-xs">
                  <div className="text-text-soft mb-1">Role</div>
                  <select
                    className="w-full rounded-xl border border-brand-100 bg-card px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300"
                    value={newInviteRole}
                    onChange={(e) => setNewInviteRole(e.target.value)}
                  >
                    <option value="org_owner">org_owner</option>
                    <option value="org_admin">org_admin</option>
                    <option value="org_member">org_member</option>
                  </select>
                </label>
                <button
                  onClick={sendInvite}
                  className="self-end inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-3 py-2 hover:bg-brand-50/50"
                >
                  <Plus size={16} /> Send invite
                </button>
              </div>

              {invites && invites.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-text-soft">
                        <th className="py-2 pr-3">Email</th>
                        <th className="py-2 pr-3">Role</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invites.map((i) => (
                        <tr key={i.id} className="border-t border-brand-100">
                          <td className="py-2 pr-3">{i.email}</td>
                          <td className="py-2 pr-3">{i.role}</td>
                          <td className="py-2 pr-3">{i.status ?? "pending"}</td>
                          <td className="py-2 text-xs">
                            <div className="flex gap-2">
                              <button
                                onClick={() => updateInvite(i.id, { status: "sent" })}
                                className="rounded-lg border border-brand-100 px-2 py-1 hover:bg-brand-50"
                              >
                                Resend
                              </button>
                              <button
                                onClick={() => updateInvite(i.id, { status: "cancelled" })}
                                className="rounded-lg border border-brand-100 px-2 py-1 hover:bg-brand-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-text-soft">No pending invites.</p>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
