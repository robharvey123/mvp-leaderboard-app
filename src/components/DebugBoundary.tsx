import React from "react";

export default class DebugBoundary extends React.Component<{ name: string }, { error?: any }> {
  constructor(props: any) {
    super(props);
    this.state = { error: undefined };
  }
  static getDerivedStateFromError(error: any) { return { error }; }
  componentDidCatch(error: any, info: any) { console.error(`[${this.props.name}]`, error, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm">
          <div className="font-semibold">Component error: {this.props.name}</div>
          <pre className="overflow-auto text-xs">{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children as React.ReactNode;
  }
}
