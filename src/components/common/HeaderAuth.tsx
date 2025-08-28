// src/components/common/HeaderAuth.tsx
import { useAuth } from "@/context/auth-context";

function initials(name?: string, email?: string) {
  if (name?.trim()) {
    const [a, b] = name.trim().split(/\s+/);
    return ((a?.[0] ?? "") + (b?.[0] ?? "")).toUpperCase() || "U";
  }
  return (email?.[0] ?? "U").toUpperCase();
}

export default function HeaderAuth() {
  const { user, loading, signIn, signOut } = useAuth();

  // Loading shimmer
  if (loading) {
    return <div className="h-9 w-[96px] rounded-lg bg-brand-100/60 animate-pulse" />;
  }

  // Signed out
  if (!user) {
    return (
      <button
        onClick={signIn}
        className="px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition"
      >
        Sign in
      </button>
    );
  }

  // Signed in
  const name =
    (user.user_metadata?.name as string) ||
    (user.user_metadata?.full_name as string) ||
    undefined;
  const email = user.email as string | undefined;
  const avatarUrl = (user.user_metadata?.avatar_url as string) || undefined;

  return (
    <div className="flex items-center gap-2">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name ?? email ?? "User avatar"}
          className="h-8 w-8 rounded-full border border-brand-200 object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-brand-600 text-white grid place-items-center text-xs font-semibold">
          {initials(name, email)}
        </div>
      )}

      <button
        onClick={signOut}
        className="px-3 py-1.5 rounded-lg border border-brand-200 bg-card hover:bg-brand-50 transition text-sm"
        title={email}
      >
        Sign out
      </button>
    </div>
  );
}
