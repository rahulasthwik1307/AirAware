'use client';

import React, { useState, useRef, useEffect, useId } from 'react';

export interface SelectOption<T extends string = string> {
  readonly value: T;
  readonly label: string;
  readonly icon?: string;
  readonly subtitle?: string;
}

export interface CustomSelectProps<T extends string = string> {
  readonly id?: string;
  readonly value: T;
  readonly options: readonly SelectOption<T>[];
  readonly onChange: (value: T) => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly disabled?: boolean;
}

export function CustomSelect<T extends string = string>({
  id: externalId,
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  className = '',
  disabled = false,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = externalId || generatedId;

  const selectedOption = options.find((opt) => opt.value === value);

  // Smart upward/downward detection based on viewport boundary
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 240 && rect.top > 240) {
        setOpenUpwards(true);
      } else {
        setOpenUpwards(false);
      }
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = options.findIndex((opt) => opt.value === value);
        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        onChange(options[nextIndex].value);
      }
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const currentIndex = options.findIndex((opt) => opt.value === value);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        onChange(options[prevIndex].value);
      }
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${selectId}-listbox`}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all text-left cursor-pointer select-none ${
          isOpen
            ? 'border-[var(--brand-primary)] bg-[var(--surface-card)] ring-2 ring-[var(--brand-primary)]/25 shadow-xs'
            : 'border-[var(--border-subtle)] bg-[var(--surface-subtle)] hover:border-[var(--brand-primary)]/40 hover:bg-[var(--surface-subtle)]/80'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="flex items-center gap-2.5 truncate">
          {selectedOption?.icon && (
            <span className="text-base leading-none shrink-0" aria-hidden="true">
              {selectedOption.icon}
            </span>
          )}
          <span className="text-sm font-medium text-[var(--ink-primary)] truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        <span className="pointer-events-none pl-2 text-[var(--ink-muted)] flex items-center shrink-0">
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--brand-primary)]' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {/* Curved Dropdown Menu Popup */}
      {isOpen && (
        <div
          id={`${selectId}-listbox`}
          role="listbox"
          aria-labelledby={selectId}
          className={`absolute left-0 right-0 z-50 max-h-56 overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-1.5 shadow-2xl space-y-0.5 animate-fadeIn ${
            openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
          style={{ boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.22), 0 4px 12px -2px rgba(15, 23, 42, 0.12)' }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer select-none ${
                  isSelected
                    ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] font-semibold'
                    : 'text-[var(--ink-primary)] hover:bg-[var(--surface-subtle)]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {option.icon && (
                    <span className="text-base leading-none shrink-0" aria-hidden="true">
                      {option.icon}
                    </span>
                  )}
                  <div className="truncate">
                    <div className="text-xs sm:text-sm font-medium leading-snug truncate">
                      {option.label}
                    </div>
                    {option.subtitle && (
                      <div className="text-[10px] text-[var(--ink-muted)] truncate font-normal">
                        {option.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <svg
                    className="w-4 h-4 text-[var(--brand-primary)] shrink-0 ml-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L7.5 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
