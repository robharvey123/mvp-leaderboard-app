// src/components/common/ErrorBoundary.tsx
import React from "react";

type Props = { children: React.ReactNode; fallback?: React.ReactNode };

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Hook up Sentry/PostHog later if you like
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 rounded-xl border bg-white dark:bg-neutral-900 dark:border-neutral-800">
          <div className="font-semibold">Something went wrong.</div>
          <div className="text-sm opacity-70">This widget failed to render.</div>
        </div>
      );
    }
    return this.props.children;
  }
}
