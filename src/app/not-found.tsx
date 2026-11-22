import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--surface-ground)] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-8 shadow-xs space-y-4">
        <div className="text-3xl" aria-hidden="true">
          🧭
        </div>
        <h1 className="text-xl font-bold font-sans text-[var(--ink-primary)]">
          Page Not Found
        </h1>
        <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
          The requested page or view could not be located. All live environmental feeds and workspaces are available from the main dashboard.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-hover)] text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-xs"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
