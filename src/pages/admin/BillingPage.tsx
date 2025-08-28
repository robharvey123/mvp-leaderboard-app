import { useState } from "react";
import { useOrg } from "@/context/OrgContext";

export default function BillingPage() {
  const { org } = useOrg();
  const [loading, setLoading] = useState(false);

  async function startCheckout(priceId: string) {
    if (!org) return;
    setLoading(true);
    const res = await fetch("/functions/v1/create-checkout-session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        club_id: org.id,
        price_id: priceId,
        success_url: window.location.origin + "/admin/billing?success=1",
        cancel_url: window.location.origin + "/admin/billing?canceled=1",
      }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Billing</h1>
      <p className="text-sm text-gray-500">Current org: {org?.name}</p>
      <div className="grid sm:grid-cols-3 gap-4">
        <PlanCard title="Starter" price="£9/mo" onClick={() => startCheckout(import.meta.env.VITE_PRICE_STARTER!)} loading={loading} />
        <PlanCard title="Club" price="£29/mo" onClick={() => startCheckout(import.meta.env.VITE_PRICE_CLUB!)} loading={loading} />
        <PlanCard title="Pro" price="£59/mo" onClick={() => startCheckout(import.meta.env.VITE_PRICE_PRO!)} loading={loading} />
      </div>
    </div>
  );
}

function PlanCard({ title, price, onClick, loading }: any) {
  return (
    <div className="rounded-2xl border p-4">
      <div className="font-semibold">{title}</div>
      <div className="text-3xl font-bold my-2">{price}</div>
      <button disabled={loading} onClick={onClick} className="mt-2 rounded-xl px-3 py-2 bg-black text-white disabled:opacity-60">
        {loading ? "Preparing…" : "Choose plan"}
      </button>
    </div>
  );
}
