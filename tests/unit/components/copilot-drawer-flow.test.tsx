// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CopilotInputArea } from '@/components/copilot/drawer/CopilotInputArea';
import { MessageBubble } from '@/components/copilot/drawer/MessageBubble';
import { CopilotDrawerShell } from '@/components/shell/CopilotDrawerShell';

describe('Copilot Drawer & Input Area Flow', () => {
  beforeEach(() => {
    cleanup();
    document.body.innerHTML = '';
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('disables send button when input query is empty or whitespace only', () => {
    const handleSend = vi.fn();
    const handleSetInput = vi.fn();
    const inputRef = { current: null };

    const { rerender } = render(
      <CopilotInputArea
        chips={['Can I open windows?']}
        activeWorkspaceLabel="Indoor Air"
        inputQuery=""
        setInputQuery={handleSetInput}
        sendMessage={handleSend}
        isThinking={false}
        cooldownSeconds={null}
        inputRef={inputRef}
      />
    );

    const sendBtn = screen.getByRole('button', { name: /send message to copilot/i });
    expect((sendBtn as HTMLButtonElement).disabled).toBe(true);

    // Whitespace only
    rerender(
      <CopilotInputArea
        chips={['Can I open windows?']}
        activeWorkspaceLabel="Indoor Air"
        inputQuery="   "
        setInputQuery={handleSetInput}
        sendMessage={handleSend}
        isThinking={false}
        cooldownSeconds={null}
        inputRef={inputRef}
      />
    );
    expect((sendBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('enforces 200-character input limit with counter', () => {
    let queryValue = '';
    const handleSetInput = vi.fn((val) => {
      queryValue = val;
    });
    const handleSend = vi.fn();
    const inputRef = { current: null };

    render(
      <CopilotInputArea
        chips={['Safe to commute?']}
        activeWorkspaceLabel="Family Planner"
        inputQuery={queryValue}
        setInputQuery={handleSetInput}
        sendMessage={handleSend}
        isThinking={false}
        cooldownSeconds={null}
        inputRef={inputRef}
      />
    );

    const input = screen.getByRole('textbox', { name: /ask copilot a question/i });
    expect(input.getAttribute('maxLength')).toBe('200');

    // Type 250 characters
    fireEvent.change(input, { target: { value: 'X'.repeat(250) } });
    expect(handleSetInput).toHaveBeenCalledWith('X'.repeat(200));
  });

  it('disables input, chips, and send button during loading/thinking state', () => {
    const handleSend = vi.fn();
    const inputRef = { current: null };

    render(
      <CopilotInputArea
        chips={['Can I run outdoors?']}
        activeWorkspaceLabel="Air Intelligence"
        inputQuery="Will smog worsen tomorrow?"
        setInputQuery={vi.fn()}
        sendMessage={handleSend}
        isThinking={true}
        cooldownSeconds={null}
        inputRef={inputRef}
      />
    );

    const input = screen.getByRole('textbox', { name: /ask copilot a question/i });
    expect((input as HTMLInputElement).disabled).toBe(true);

    const sendBtn = screen.getByRole('button', { name: /send message to copilot/i });
    expect((sendBtn as HTMLButtonElement).disabled).toBe(true);

    const chipBtn = screen.getByRole('button', { name: 'Can I run outdoors?' });
    expect((chipBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('renders Guidance System Alert when a message encounters an error', () => {
    const errorMessage = {
      id: 'err-1',
      sender: 'assistant' as const,
      timestamp: '2026-11-23T12:00:00Z',
      isError: true,
      errorMessage: 'Workers AI inference service timed out. Fallback engaged.',
    };

    render(<MessageBubble message={errorMessage} />);

    expect(screen.getByText('Guidance System Alert')).toBeDefined();
    expect(screen.getByText(/Workers AI inference service timed out/i)).toBeDefined();
  });

  it('renders CopilotDrawerShell and handles close button click', () => {
    const handleClose = vi.fn();

    render(
      <CopilotDrawerShell
        isOpen={true}
        onClose={handleClose}
        activeWorkspace="air-intelligence"
      />
    );

    expect(screen.getByText(/ai air copilot/i)).toBeDefined();
    const closeBtn = screen.getByRole('button', { name: /close ai copilot drawer/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
