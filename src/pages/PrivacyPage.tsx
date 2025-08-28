import { Link } from "react-router-dom";

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <p className="mt-3 text-neutral-700">We respect your privacy. This placeholder outlines how club and player data is stored, processed, and deleted. Replace with your full policy before launch.</p>
        <ul className="mt-6 list-disc pl-6 text-neutral-700 space-y-2">
          <li>Data is encrypted in transit and at rest.</li>
          <li>Club admins control visibility of public pages.</li>
          <li>Exports and deletions available on request.</li>
        </ul>
        <p className="mt-8 text-sm text-neutral-500"><Link to="/" className="underline">Back to home</Link></p>
      </div>
    </div>
  );
}
