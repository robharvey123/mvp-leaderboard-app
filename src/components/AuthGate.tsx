// src/components/AuthGate.tsx
import React from "react";
import { useAuth } from "@/context/auth-context";

type AuthGateProps = {
  children: React.ReactNode;
  /** Optional UI when we're still checking the session */
  whileLoading?: React.ReactNode;
  /** Optional UI when the user isn't signed in */
  fallback?: React.ReactNode;
};

export default function AuthGate({ children, whileLoading, fallback }: AuthGateProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      whileLoading ?? (
        <div className="p-4 text-text-soft">Checking access…</div>
      )
    );
  }

  if (!user) {
    return (
      fallback ?? (
        <div className="p-4">
          <div className="max-w-lg rounded-2xl border border-brand-100 bg-card p-4">
            <h2 className="font-semibold mb-1">Sign in required</h2>
            <p className="text-sm text-text-soft">
              Please sign in using the button in the top-right to access this page.
            </p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
