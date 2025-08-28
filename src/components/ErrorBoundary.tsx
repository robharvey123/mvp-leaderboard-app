// src/components/ErrorBoundary.tsx
import React from "react";

type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: any): State {
    return { hasError: true, message: err?.message ?? "Something went wrong." };
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h1 className="text-xl font-semibold mb-2">Oops — something bowled us over.</h1>
          <p className="text-text-soft">{this.state.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, message: undefined })}
            className="mt-4 rounded-xl px-3 py-2 bg-[rgb(var(--brand-600))] hover:bg-[rgb(var(--brand-700))] text-white"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
