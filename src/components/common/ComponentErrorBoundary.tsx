'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  readonly children: ReactNode;
  readonly fallbackTitle?: string;
  readonly fallbackMessage?: string;
}

interface State {
  readonly hasError: boolean;
  readonly error: Error | null;
}

export class ComponentErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Gracefully catch localized rendering failures (e.g. WebGL or canvas errors)
    if (process.env.NODE_ENV === 'development') {
      console.warn('[AirAware ComponentErrorBoundary caught]:', error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] text-center space-y-3">
          <div className="text-2xl" aria-hidden="true">
            ⚠️
          </div>
          <h3 className="text-sm font-bold text-[var(--ink-primary)] font-sans">
            {this.props.fallbackTitle || 'Visualization unavailable'}
          </h3>
          <p className="text-xs text-[var(--ink-secondary)] max-w-sm mx-auto">
            {this.props.fallbackMessage ||
              'Unable to render this module on your current display or device. All other telemetry and health data remain fully functional.'}
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[var(--surface-subtle)] hover:bg-[var(--brand-surface)] text-[var(--ink-primary)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
          >
            Retry display
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
