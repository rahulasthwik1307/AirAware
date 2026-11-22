'use client';

import { useEffect } from 'react';

interface ErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected errors in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[AirAware Application Error]:', error);
    }
  }, [error]);

  return (
    <main className="min-h-screen bg-[var(--surface-ground)] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-8 shadow-xs space-y-4">
        <div className="text-3xl" aria-hidden="true">
          🌱
        </div>
        <h1 className="text-xl font-bold font-sans text-[var(--ink-primary)]">
          Something went wrong
        </h1>
        <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
          AirAware encountered an unexpected issue while loading environmental intelligence. Your saved profile, cities, and chats are safely stored on this device.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-xs"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
