"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export class ErrorBoundary extends Component<Props, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-[#3b7cf4] text-white px-6 py-2.5 font-semibold"
            >
              Reload
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
