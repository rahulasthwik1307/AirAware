'use client';

interface GlobalErrorProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function GlobalError({ reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
          <div className="text-3xl" aria-hidden="true">
            🌍
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            System Error
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            A critical system error occurred. You can reload the application safely without losing your local device preferences.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-xs"
            >
              Reload AirAware
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
