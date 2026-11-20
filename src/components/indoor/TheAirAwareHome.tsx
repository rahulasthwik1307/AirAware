'use client';

import React from 'react';
import { RoomType, RoomProfile } from '@/domain/indoor/types';
import { getStandardRoomProfiles } from '@/domain/indoor/calculations';

interface TheAirAwareHomeProps {
  readonly selectedRoomId: RoomType;
  readonly roomAreas: Record<RoomType, number>;
  readonly onSelectRoom: (roomId: RoomType) => void;
  readonly onUpdateArea: (roomId: RoomType, area: number) => void;
  readonly onAskCopilot?: (question: string) => void;
}

export function TheAirAwareHome({
  selectedRoomId,
  roomAreas,
  onSelectRoom,
  onUpdateArea,
  onAskCopilot,
}: TheAirAwareHomeProps) {
  const rooms = getStandardRoomProfiles();
  const currentRoom = rooms.find((r) => r.id === selectedRoomId) || rooms[0];
  const currentArea = roomAreas[currentRoom.id] || currentRoom.defaultAreaM2;

  return (
    <section
      aria-labelledby="airaware-home-heading"
      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 sm:p-6 shadow-xs space-y-5"
    >
      {/* Header with Scientific Model Badging */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2
              id="airaware-home-heading"
              className="text-base sm:text-lg font-bold text-[var(--ink-primary)] font-sans"
            >
              The AirAware Home
            </h2>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[var(--surface-subtle)] text-[var(--ink-secondary)] border border-[var(--border-subtle)]">
              Interactive Educational Model
            </span>
          </div>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Explore micro-environment vulnerabilities and localized exposure mitigations.
          </p>
        </div>

        {/* Explicit No-Sensor Disclaimer Badge */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] font-mono font-medium">
          <span aria-hidden="true">🔒</span>
          <span>No Indoor Sensor Required • Scenario Explorer</span>
        </div>
      </div>

      {/* SVG Interactive Architectural Cutaway */}
      <div className="relative w-full rounded-xl bg-[var(--surface-subtle)]/70 p-3 sm:p-5 border border-[var(--border-subtle)] overflow-hidden">
        {/* Subtle Room Labels in SVG Cross-Section */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
          {rooms.map((room) => {
            const isSelected = room.id === selectedRoomId;
            const area = roomAreas[room.id] || room.defaultAreaM2;

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => onSelectRoom(room.id)}
                className={`group relative text-left p-3.5 sm:p-4 rounded-xl transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-white border-[var(--brand-primary)] shadow-md ring-2 ring-[var(--brand-primary)]/20'
                    : 'bg-white/80 hover:bg-white border-[var(--border-subtle)] hover:border-[var(--brand-primary)]/40 hover:shadow-xs'
                }`}
                aria-pressed={isSelected}
                aria-label={`Select ${room.name}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl sm:text-3xl" aria-hidden="true">
                    {room.icon}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--ink-secondary)] font-medium border border-[var(--border-subtle)]">
                    {area} m² <span className="text-[9px] text-[var(--ink-muted)]">[User]</span>
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[var(--ink-primary)] font-sans mt-2 group-hover:text-[var(--brand-primary)] transition-colors">
                  {room.name}
                </h3>

                <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 line-clamp-1">
                  {room.tag}
                </p>

                {isSelected && (
                  <span className="absolute top-2 right-2 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-primary)] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand-primary)]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Room Deep Dive Panel */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" aria-hidden="true">{currentRoom.icon}</span>
            <div>
              <h3 className="text-base font-bold text-[var(--ink-primary)] font-sans">
                {currentRoom.name}
              </h3>
              <span className="text-xs text-[var(--brand-primary)] font-medium font-sans">
                {currentRoom.tag}
              </span>
            </div>
          </div>

          {/* Area Customization Control */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-[var(--surface-subtle)] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)]">
            <label htmlFor={`area-input-${currentRoom.id}`} className="text-xs text-[var(--ink-secondary)] font-medium">
              Floor Area:
            </label>
            <input
              id={`area-input-${currentRoom.id}`}
              type="number"
              min="4"
              max="150"
              value={currentArea}
              onChange={(e) => onUpdateArea(currentRoom.id, Number(e.target.value))}
              className="w-14 px-1.5 py-0.5 text-xs font-mono font-bold text-[var(--ink-primary)] bg-white rounded border border-[var(--border-subtle)] text-right focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
            />
            <span className="text-xs font-mono text-[var(--ink-muted)]">m²</span>
          </div>
        </div>

        {/* Primary Pollution Risks Grid */}
        <div>
          <h4 className="text-xs font-mono font-bold text-[var(--ink-muted)] uppercase tracking-wider mb-2">
            Key Environmental Exposure Vectors
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentRoom.primaryPollutantRisks.map((risk, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-subtle)]/40 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--ink-primary)] font-sans">
                    {risk.pollutant}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 uppercase font-semibold">
                    {risk.severity} risk
                  </span>
                </div>
                <p className="text-[11px] text-[var(--ink-secondary)] leading-relaxed">
                  {risk.source}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Practical Mitigations Checklist */}
        <div>
          <h4 className="text-xs font-mono font-bold text-[var(--ink-muted)] uppercase tracking-wider mb-2">
            Practical Daily Action Steps
          </h4>
          <ul className="space-y-2">
            {currentRoom.practicalMitigations.map((mitigation, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[var(--border-subtle)] bg-white text-xs text-[var(--ink-secondary)]"
              >
                <span className="text-[var(--brand-primary)] font-bold text-sm leading-none mt-0.5">✓</span>
                <div>
                  <strong className="text-[var(--ink-primary)] font-semibold font-sans block">
                    {mitigation.action}
                  </strong>
                  <span className="text-[11px] text-[var(--ink-muted)] leading-relaxed mt-0.5 block">
                    {mitigation.detail}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Filtration Consideration & Contextual Copilot Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[var(--brand-surface)]/60 border border-[var(--brand-primary)]/20 text-xs">
          <div className="space-y-0.5 max-w-xl">
            <span className="font-bold text-[var(--brand-primary)] font-mono text-[11px] uppercase tracking-wider block">
              💡 Air Cleaning Strategy
            </span>
            <p className="text-[11px] text-[var(--ink-secondary)] leading-relaxed">
              {currentRoom.filtrationAdvice}
            </p>
          </div>

          {onAskCopilot && (
            <button
              type="button"
              onClick={() => onAskCopilot(`How can I improve air quality in my ${currentRoom.name}?`)}
              className="px-3 py-1.5 rounded-lg bg-white text-[var(--brand-primary)] hover:bg-[var(--brand-surface)] text-xs font-mono font-bold border border-[var(--brand-primary)]/30 shadow-2xs transition-all cursor-pointer self-start sm:self-auto shrink-0 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            >
              <span>🤖</span>
              <span>Ask Copilot about {currentRoom.name}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
