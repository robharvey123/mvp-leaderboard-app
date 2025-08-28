import { Link } from "react-router-dom";

export function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-3xl font-semibold">Terms of Service</h1>
        <p className="mt-3 text-neutral-700">These are example terms for the MVP Cricket App. Replace with your final legal text.</p>
        <ol className="mt-6 list-decimal pl-6 text-neutral-700 space-y-2">
          <li>Use is club‑scoped; admins manage user access.</li>
          <li>No guarantee of uninterrupted service; we’ll do our best.</li>
          <li>Billing is monthly; cancel anytime before your renewal.</li>
        </ol>
        <p className="mt-8 text-sm text-neutral-500"><Link to="/" className="underline">Back to home</Link></p>
      </div>
    </div>
  );
}
