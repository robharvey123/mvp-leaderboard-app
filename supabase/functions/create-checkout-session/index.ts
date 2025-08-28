import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.23.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { club_id, price_id, success_url, cancel_url } = await req.json();
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });

  // Look up (or create) a customer for this club
  const { data: club } = await supabase.from("clubs").select("*").eq("id", club_id).maybeSingle();
  if (!club) return new Response("Club not found", { status: 404 });

  const customer = club.stripe_customer_id
    ? await stripe.customers.retrieve(club.stripe_customer_id)
    : await stripe.customers.create({ name: club.name, metadata: { club_id } });

  if (!club.stripe_customer_id && "id" in customer) {
    await supabase.from("clubs").update({ stripe_customer_id: customer.id }).eq("id", club_id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: "id" in customer ? customer.id : undefined,
    line_items: [{ price: price_id, quantity: 1 }],
    success_url,
    cancel_url,
    metadata: { club_id },
  });

  return new Response(JSON.stringify({ url: session.url }), { headers: { "content-type": "application/json" } });
});
