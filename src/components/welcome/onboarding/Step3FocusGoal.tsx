'use client';

import React from 'react';
import { WorkspaceKey } from '@/domain/types';
import { FOCUS_GOALS } from './constants';

interface Step3FocusGoalProps {
  readonly selectedWorkspace: WorkspaceKey;
  readonly onSelectWorkspace: (workspace: WorkspaceKey) => void;
}

export function Step3FocusGoal({
  selectedWorkspace,
  onSelectWorkspace,
}: Step3FocusGoalProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2
          id="onboarding-modal-title"
          className="text-xl sm:text-2xl font-black text-slate-900 font-sans tracking-tight"
        >
          What is your main focus today?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
          Choose what matters most to your routine right now. This selects your primary landing workspace upon launch.
        </p>
      </div>

      {/* Workspace Select Options */}
      <div className="space-y-2">
        {FOCUS_GOALS.map((goal) => {
          const isSelected = selectedWorkspace === goal.workspace;
          return (
            <div
              key={goal.workspace}
              onClick={() => onSelectWorkspace(goal.workspace)}
              className={`p-3 sm:p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                isSelected
                  ? 'border-teal-700 bg-teal-50/60 shadow-2xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-teal-700">
                {isSelected && (
                  <div className="h-2 w-2 rounded-full bg-teal-700" />
                )}
              </div>
              <div className="flex-1 space-y-0.5">
                <span className="text-sm font-bold text-slate-900 block">
                  {goal.title}
                </span>
                <p className="text-xs text-slate-600 leading-relaxed font-sans">
                  {goal.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
