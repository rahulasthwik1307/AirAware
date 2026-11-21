'use client';

import React, { useState } from 'react';
import { CleanerHabit } from '@/domain/choices/types';

interface SustainableHabitHubCardProps {
  readonly habits: readonly CleanerHabit[];
  readonly onToggleAdoption: (id: string) => void;
  readonly onToggleDay: (id: string, dayIndex: number) => void;
  readonly onCompleteToday: (id: string) => void;
  readonly onAskCopilot: (prompt: string) => void;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function SustainableHabitHubCard({
  habits,
  onToggleAdoption,
  onToggleDay,
  onCompleteToday,
  onAskCopilot,
}: SustainableHabitHubCardProps) {
  const [filter, setFilter] = useState<'ALL' | 'ADOPTED'>('ALL');

  const visibleHabits = habits.filter((h) => {
    if (filter === 'ADOPTED') return h.isAdopted;
    return true;
  });

  // Calculate today's day index (Mon=0 ... Sun=6)
  const now = new Date();
  const day = now.getDay();
  const todayIndex = (day + 6) % 7;

  return (
    <article
      className="p-5 sm:p-6 rounded-3xl bg-[var(--surface-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between gap-5 transition-shadow hover:shadow-md"
      aria-labelledby="habit-hub-heading"
    >
      {/* Header: Uniform 2-Row Layout */}
      <div className="flex flex-col gap-1.5 pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">
              🎯
            </span>
            <h2
              id="habit-hub-heading"
              className="text-base sm:text-lg font-bold text-[var(--ink-primary)] truncate font-sans tracking-tight"
            >
              Winter Smog Actionable Habit Hub
            </h2>
          </div>
          <button
            type="button"
            onClick={() =>
              onAskCopilot(
                'What are the most impactful low-cost winter smog daily habits for families living under thermal inversion conditions? How does stagger timing combine with transit choices?'
              )
            }
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--surface-subtle)] hover:bg-[var(--surface-card)] text-[var(--brand-primary)] border border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 shadow-2xs transition-colors shrink-0 cursor-pointer"
            title="Ask Copilot about winter smog habits"
          >
            <span className="text-sm">🤖</span>
            <span>Ask Copilot</span>
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-violet-50 text-violet-800 border border-violet-200 shrink-0">
            Habit Adherence Loop
          </span>
          <p className="text-xs text-[var(--ink-secondary)] truncate">
            Adopt, complete, and track defensible clean-air routines.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer tactile-btn ${
              filter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-[var(--surface-subtle)] text-[var(--ink-secondary)] hover:bg-slate-200'
            }`}
          >
            All Smog Habits ({habits.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('ADOPTED')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer tactile-btn ${
              filter === 'ADOPTED'
                ? 'bg-slate-900 text-white'
                : 'bg-[var(--surface-subtle)] text-[var(--ink-secondary)] hover:bg-slate-200'
            }`}
          >
            Adopted ({habits.filter((h) => h.isAdopted).length})
          </button>
        </div>
        <span className="text-[11px] font-mono text-[var(--ink-muted)]">
          100% Local-First
        </span>
      </div>

      {/* Chart 4: Interactive 7-Day Punchcard Dot Matrix */}
      <div className="space-y-3">
        {visibleHabits.map((habit) => {
          const isDoneToday = habit.weeklyCompletions[todayIndex];

          return (
            <div
              key={habit.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                habit.isAdopted
                  ? 'bg-white border-slate-200 shadow-2xs'
                  : 'bg-slate-50/70 border-dashed border-slate-300 opacity-80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="text-xl shrink-0 mt-0.5">{habit.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {habit.title}
                      </h4>
                      {habit.isAdopted && habit.currentStreakDays > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 shrink-0">
                          🔥 {habit.currentStreakDays}d streak
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {habit.description}
                    </p>
                  </div>
                </div>

                {/* Adopt / Done Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {habit.isAdopted ? (
                    <button
                      type="button"
                      onClick={() => onCompleteToday(habit.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 tactile-btn ${
                        isDoneToday
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <span>{isDoneToday ? '✓ Done Today' : '+ Log Today'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleAdoption(habit.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 transition-colors cursor-pointer tactile-btn"
                    >
                      + Adopt Habit
                    </button>
                  )}
                </div>
              </div>

              {/* 7-Day Dot Punchcard Row */}
              {habit.isAdopted && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    7-Day Rhythm:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {DAY_LABELS.map((dayLabel, idx) => {
                      const isCompleted = habit.weeklyCompletions[idx];
                      const isToday = idx === todayIndex;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => onToggleDay(habit.id, idx)}
                          title={`${dayLabel} (${isCompleted ? 'Completed' : 'Missed'}) - Click to toggle`}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all cursor-pointer tactile-btn ${
                            isCompleted
                              ? 'bg-emerald-500 text-white shadow-2xs scale-105'
                              : isToday
                              ? 'bg-slate-200 text-slate-700 ring-2 ring-emerald-500/40'
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {isCompleted ? '✓' : dayLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Exposure Defense Footer */}
      <div className="p-3 rounded-2xl bg-violet-50/70 border border-violet-200 text-xs text-violet-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>🛡️</span>
          <span className="font-semibold text-[11px]">
            Adopted routines directly shield vulnerable family members from morning inversion peaks.
          </span>
        </div>
      </div>
    </article>
  );
}
