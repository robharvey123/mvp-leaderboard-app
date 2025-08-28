import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.23.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    return new Response(`Webhook error: ${(err as any).message}`, { status: 400 });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const club_id = (s.metadata?.club_id as string) || null;
    const sub_id = typeof s.subscription === "string" ? s.subscription : (s.subscription as any)?.id;
    const price_id = s?.line_items?.data?.[0]?.price?.id || (s as any).display_items?.[0]?.plan?.id;

    if (club_id) {
      await supabase.from("clubs").update({
        billing_status: "active",
        stripe_subscription_id: sub_id,
        stripe_price_id: price_id,
      }).eq("id", club_id);
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const club_id = sub.metadata?.club_id || sub.customer as string | undefined;

    // Option: store club_id in subscription metadata when creating
    const status = sub.status === "active" || sub.status === "trialing" ? "active"
                  : sub.status === "past_due" ? "past_due"
                  : "inactive";

    if (club_id) {
      await supabase.from("clubs").update({
        billing_status: status,
        stripe_subscription_id: sub.id,
        stripe_price_id: typeof sub.items.data[0]?.price?.id === "string" ? sub.items.data[0].price.id : null
      }).eq("id", club_id);
    }
  }

  return new Response("ok");
});
