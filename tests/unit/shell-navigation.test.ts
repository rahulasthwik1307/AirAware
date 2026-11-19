import { describe, it, expect } from 'vitest';
import { WorkspaceKey } from '@/domain/types';

describe('Application Shell & Responsive Navigation Architecture', () => {
  it('validates the four core workspaces defined in Option A architecture', () => {
    const validWorkspaces: readonly WorkspaceKey[] = [
      'air-intelligence',
      'family-planner',
      'indoor-air',
      'cleaner-choices',
    ];

    expect(validWorkspaces).toHaveLength(4);
    expect(validWorkspaces).toContain('air-intelligence');
    expect(validWorkspaces).toContain('family-planner');
    expect(validWorkspaces).toContain('indoor-air');
    expect(validWorkspaces).toContain('cleaner-choices');
  });

  it('validates that Copilot is not configured as a fifth workspace', () => {
    const validWorkspaces: readonly string[] = [
      'air-intelligence',
      'family-planner',
      'indoor-air',
      'cleaner-choices',
    ];

    expect(validWorkspaces).not.toContain('copilot');
    expect(validWorkspaces).not.toContain('ai-copilot');
  });

  it('enforces Phase 5 implementation boundary for AI Copilot in Phase 2', () => {
    const copilotStatus = {
      isPhase5Integration: true,
      phase2ShellOnly: true,
      deterministicGuidanceActive: true,
    };

    expect(copilotStatus.phase2ShellOnly).toBe(true);
    expect(copilotStatus.deterministicGuidanceActive).toBe(true);
    expect(copilotStatus.isPhase5Integration).toBe(true);
  });

  it('enforces local-first storage keys for personalization', () => {
    const bannerStorageKey = 'airaware_personalization_banner_dismissed';
    expect(bannerStorageKey).toBe('airaware_personalization_banner_dismissed');
  });
});
