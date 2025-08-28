// src/pages/SettingsPage.tsx
export default function SettingsPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="text-neutral-600">
        Club and account settings will appear here.
      </p>
      <ul className="list-disc pl-6 text-sm text-neutral-700 space-y-1">
        <li>Club details (name, colours, logo)</li>
        <li>Team management</li>
        <li>User roles & permissions</li>
        <li>Billing & subscription</li>
      </ul>
    </div>
  );
}
