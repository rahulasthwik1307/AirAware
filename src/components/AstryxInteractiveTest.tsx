'use client';

import React, { useState } from 'react';
import { Button } from '@astryxdesign/core/Button';

export function AstryxInteractiveTest() {
  const [clickCount, setClickCount] = useState(0);

  return (
    <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-white border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]">
      <div className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-muted)]">
        Astryx Component Verification
      </div>
      <div className="flex items-center gap-4">
        <Button
          label="Test Astryx Button"
          variant="primary"
          onClick={() => setClickCount((prev) => prev + 1)}
        />
        <span
          className="text-sm text-[var(--ink-primary)] font-mono tabular-nums bg-[var(--surface-subtle)] px-3 py-1.5 rounded-md border border-[var(--border-subtle)]"
          aria-live="polite"
        >
          Count: {clickCount}
        </span>
      </div>
      {clickCount > 0 && (
        <p className="text-xs text-[var(--aqi-good)] font-medium">
          ✓ Astryx interactive button dispatched event successfully ({clickCount}{' '}
          {clickCount === 1 ? 'click' : 'clicks'})
        </p>
      )}
    </div>
  );
}
