'use client';

import React from 'react';
import { RoomType } from '@/domain/indoor/types';
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
      className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-2.5 sm:space-y-3 flex flex-col justify-start overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-slate-100 pb-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0" aria-hidden="true">🏠</span>
            <h2
              id="airaware-home-heading"
              className="text-base sm:text-lg font-bold text-slate-900 font-sans tracking-tight truncate"
            >
              The AirAware Home
            </h2>
          </div>

          {onAskCopilot && (
            <button
              type="button"
              onClick={() =>
                onAskCopilot(
                  `How can I protect air quality in my ${currentRoom.name} (${currentArea}m²) against ${currentRoom.primaryPollutantRisks[0]?.pollutant || 'indoor pollutants'}?`
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100 text-sky-800 text-xs font-mono font-bold border border-sky-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
            >
              <span className="text-sm">🤖</span>
              <span>Ask Copilot</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
            Interactive Scenario Explorer
          </span>
          <p className="text-xs text-slate-500 whitespace-nowrap">
            Room vulnerabilities &amp; localized mitigations.
          </p>
        </div>
      </div>

      {/* Architectural Room Selection Grid - Larger & Generous Boxes */}
      <div className="rounded-xl border border-slate-200/90 bg-gradient-to-b from-slate-50 to-slate-100/60 p-3 sm:p-3.5 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span className="font-bold uppercase tracking-wider text-slate-700">
            Architectural Room Selection
          </span>
          <span className="text-[10px]">Click a room to inspect breathing zone</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {rooms.map((room) => {
            const isSelected = room.id === selectedRoomId;
            const area = roomAreas[room.id] || room.defaultAreaM2;

            const vectorBadge =
              room.id === 'kitchen'
                ? { label: 'Cooking Fumes & NO₂', color: 'bg-rose-50 text-rose-700 border-rose-200' }
                : room.id === 'living_room'
                ? { label: 'Dust & Infiltration', color: 'bg-amber-50 text-amber-700 border-amber-200' }
                : room.id === 'bedroom'
                ? { label: 'CO₂ & Night Airflow', color: 'bg-blue-50 text-blue-700 border-blue-200' }
                : { label: 'Resuspended Dust', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

            return (
              <button
                key={room.id}
                type="button"
                onClick={() => onSelectRoom(room.id)}
                className={`relative text-left p-3 sm:p-3.5 rounded-xl transition-all cursor-pointer border flex flex-col justify-between min-h-[88px] sm:min-h-[96px] ${
                  isSelected
                    ? 'bg-white border-sky-500 shadow-md ring-2 ring-sky-500/20'
                    : 'bg-white/95 hover:bg-white border-slate-200/90 hover:border-sky-300 hover:shadow-xs'
                }`}
                aria-pressed={isSelected}
                aria-label={`Select ${room.name}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" aria-hidden="true">{room.icon}</span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 font-sans leading-tight">
                        {room.name}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-sans block leading-tight">
                        {room.tag}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200 shrink-0">
                    {area} m²
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full border ${vectorBadge.color}`}
                  >
                    {vectorBadge.label}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-mono font-bold text-sky-700 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                      Active
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Room Deep Dive Panel - Directly Connected with Zero Empty Space */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:p-3.5 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">{currentRoom.icon}</span>
            <div>
              <span className="text-xs font-bold text-slate-900 font-sans">
                {currentRoom.name}
              </span>
              <span className="text-[11px] text-slate-500 ml-2 font-mono">
                [Calculated Volume: {(currentArea * 2.7).toFixed(1)} m³ at 2.7m ceiling]
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="room-area-input" className="text-xs font-semibold text-slate-700">
              Floor Area:
            </label>
            <div className="flex items-center">
              <input
                id="room-area-input"
                type="number"
                min={4}
                max={150}
                value={currentArea}
                onChange={(e) => onUpdateArea(currentRoom.id, Math.max(4, Number(e.target.value) || 4))}
                className="w-16 px-2 py-0.5 text-xs font-mono font-bold bg-white text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <span className="text-xs font-mono text-slate-500 ml-1">m²</span>
            </div>
          </div>
        </div>

        {/* Actionable Micro-Mitigations */}
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
            Practical Daily Action Steps
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentRoom.practicalMitigations.slice(0, 2).map((mitigation, idx) => (
              <div
                key={idx}
                className="rounded-lg bg-white p-2 border border-slate-200/80 text-xs space-y-0.5 shadow-2xs"
              >
                <div className="flex items-start gap-1.5">
                  <span className="text-emerald-700 font-bold shrink-0 mt-0.5" aria-hidden="true">✓</span>
                  <strong className="text-slate-900 font-semibold leading-tight text-[11px]">
                    {mitigation.action}
                  </strong>
                </div>
                <p className="text-[10px] text-slate-600 leading-normal pl-3.5">
                  {mitigation.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Air Cleaning Strategy */}
        <div className="rounded-lg bg-sky-50/80 border border-sky-200/80 p-2 flex items-start gap-1.5 text-xs text-sky-950">
          <span className="text-sky-700 font-bold shrink-0 text-[11px]">💡 Strategy:</span>
          <span className="text-[11px] leading-snug">
            {currentRoom.filtrationAdvice}
          </span>
        </div>
      </div>
    </section>
  );
}
