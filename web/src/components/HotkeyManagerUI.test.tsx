import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { HotkeyManagerUI } from './HotkeyManagerUI';

describe('HotkeyManagerUI', () => {
  it('renders the header correctly', () => {
    render(<HotkeyManagerUI />);
    expect(screen.getByText('Tuş Atamaları (Global Hotkeys)')).toBeInTheDocument();
  });

  it('renders all hotkeys initially', () => {
    render(<HotkeyManagerUI />);
    expect(screen.getByText('Max Gama Boost')).toBeInTheDocument();
    expect(screen.getByText('F11')).toBeInTheDocument();
    expect(screen.getByText('Digital Vibrance Toggle')).toBeInTheDocument();
    expect(screen.getByText('F12')).toBeInTheDocument();
  });

  it('enters editing mode when a hotkey item is clicked', async () => {
    const user = userEvent.setup();
    render(<HotkeyManagerUI />);

    const hotkeyItem = screen.getByTestId('hotkey-item-1');
    await user.click(hotkeyItem);

    // The input should now be visible and focused
    const input = screen.getByTestId('hotkey-input-1');
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(input).toHaveValue('Press a key...');
  });

  it('updates the hotkey state when a new key is pressed', async () => {
    const user = userEvent.setup();
    render(<HotkeyManagerUI />);

    // Click to edit the first hotkey (Max Gama Boost)
    const hotkeyItem = screen.getByTestId('hotkey-item-1');
    await user.click(hotkeyItem);

    const input = screen.getByTestId('hotkey-input-1');

    // Simulate pressing 'Ctrl' + 'J'
    await user.keyboard('{Control>}J{/Control}');

    // The editing mode should exit and the new hotkey should be displayed
    expect(screen.queryByTestId('hotkey-input-1')).not.toBeInTheDocument();
    expect(screen.getByText('Ctrl + J')).toBeInTheDocument();
    // The old 'F11' should no longer be in the document
    expect(screen.queryByText('F11')).not.toBeInTheDocument();
  });

  it('cancels editing when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<HotkeyManagerUI />);

    // Click to edit the second hotkey
    const hotkeyItem = screen.getByTestId('hotkey-item-2');
    await user.click(hotkeyItem);

    // Press Escape
    await user.keyboard('{Escape}');

    // The editing mode should exit and the original hotkey 'F12' should still be displayed
    expect(screen.queryByTestId('hotkey-input-2')).not.toBeInTheDocument();
    expect(screen.getByText('F12')).toBeInTheDocument();
  });

  it('ignores standalone modifier keys during editing', async () => {
    const user = userEvent.setup();
    render(<HotkeyManagerUI />);

    const hotkeyItem = screen.getByTestId('hotkey-item-3');
    await user.click(hotkeyItem);

    // Press only Shift
    await user.keyboard('{Shift}');

    // Should still be in editing mode
    expect(screen.getByTestId('hotkey-input-3')).toBeInTheDocument();

    // Now press Shift+A
    await user.keyboard('{Shift>}A{/Shift}');

    // Editing mode should end and show 'Shift + A'
    expect(screen.queryByTestId('hotkey-input-3')).not.toBeInTheDocument();
    expect(screen.getByText('Shift + A')).toBeInTheDocument();
  });
});
