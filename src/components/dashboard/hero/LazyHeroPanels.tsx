import dynamic from 'next/dynamic';

export const LazyGlobePanel = dynamic(
  () => import('./GlobePanel').then((mod) => mod.GlobePanel),
  {
    ssr: false,
    loading: () => (
      <div
        id="panel-globe"
        role="tabpanel"
        aria-labelledby="tab-globe"
        className="w-full h-[540px] sm:h-[620px] lg:h-[680px] rounded-3xl flex flex-col items-center justify-center bg-[#0F172A] text-slate-200 gap-3 border border-slate-800/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.5)] select-none"
      >
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-teal-500 border-t-transparent" />
        <span className="text-xs font-mono text-slate-400 font-medium">
          Loading 3D Atmospheric Globe...
        </span>
      </div>
    ),
  }
);

export const LazyRegionalComparePanel = dynamic(
  () => import('./RegionalComparePanel').then((mod) => mod.RegionalComparePanel),
  {
    ssr: false,
    loading: () => (
      <div
        id="panel-compare"
        role="tabpanel"
        aria-labelledby="tab-compare"
        className="w-full h-[540px] sm:h-[620px] lg:h-[680px] rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 overflow-y-auto space-y-4 shadow-lg flex flex-col items-center justify-center gap-3"
      >
        <div className="h-7 w-7 animate-spin rounded-full border-3 border-sky-600 border-t-transparent" />
        <p className="text-xs font-mono text-slate-500">
          Loading live regional comparison estimates...
        </p>
      </div>
    ),
  }
);
