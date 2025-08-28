// Minimal accept: POST { token } with authenticated user
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { token } = await req.json();
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: inv, error } = await supabase.from("org_invites").select("*").eq("token", token).maybeSingle();
  if (error || !inv) return new Response("Invalid token", { status: 400 });

  const auth = req.headers.get("x-client-info") || "";
  // In production, read user id from Authorization: Bearer <supabase_jwt>
  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
  const { data: user } = await supabase.auth.getUser(jwt!);
  const uid = user.user?.id;
  if (!uid) return new Response("No user", { status: 401 });

  await supabase.from("user_org_roles").upsert({ user_id: uid, club_id: inv.club_id, role: inv.role });
  await supabase.from("org_invites").update({ accepted_at: new Date().toISOString() }).eq("token", token);

  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
});
