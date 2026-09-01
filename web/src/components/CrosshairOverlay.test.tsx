import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CrosshairOverlay } from './CrosshairOverlay';
import { DisplaySettings } from '../types';

const defaultSettings = {
  gamma: 1.0,
  digitalVibrance: 50,
  brightnessOffset: 0,
  contrast: 1.0,
  rgbRed: 1.0,
  rgbGreen: 1.0,
  rgbBlue: 1.0,
  sharpness: 0,
  colorTemperature: 6500,
  shadowDetail: 0,
  crosshairEnabled: true,
  crosshairStyle: 'cross',
  crosshairColor: '#00FF66',
  crosshairSize: 10,
} as DisplaySettings;

describe('CrosshairOverlay Component', () => {
  it('renders the component with correct title', () => {
    render(<CrosshairOverlay settings={defaultSettings} onChange={vi.fn()} />);

    expect(screen.getByText('Özel PvP Nişangah (Crosshair Overlay)')).toBeInTheDocument();
  });

  it('triggers onChange when toggle switch is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<CrosshairOverlay settings={defaultSettings} onChange={handleChange} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(handleChange).toHaveBeenCalledWith({ crosshairEnabled: false });
  });

  it('renders nothing else when disabled', () => {
    const disabledSettings = { ...defaultSettings, crosshairEnabled: false };
    render(<CrosshairOverlay settings={disabledSettings} onChange={vi.fn()} />);

    expect(screen.queryByText('Stil:')).not.toBeInTheDocument();
    expect(screen.queryByText('Renk:')).not.toBeInTheDocument();
  });

  it('triggers onChange when a style button is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<CrosshairOverlay settings={defaultSettings} onChange={handleChange} />);

    const dotButton = screen.getByText('Nokta');
    await user.click(dotButton);

    expect(handleChange).toHaveBeenCalledWith({ crosshairStyle: 'dot' });
  });

  it('triggers onChange when a color button is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    const { container } = render(<CrosshairOverlay settings={defaultSettings} onChange={handleChange} />);

    // Select the button by its background color #FF0055
    // Querying all color buttons by style and clicking the second one (#FF0055 is the second one in the list)
    const colorButtons = container.querySelectorAll('button[style*="background-color"]');

    await user.click(colorButtons[1]);

    // The second color in the array is #FF0055
    expect(handleChange).toHaveBeenCalledWith({ crosshairColor: '#FF0055' });
  });

  it('triggers onChange when the size slider is changed', async () => {
    const handleChange = vi.fn();

    render(<CrosshairOverlay settings={defaultSettings} onChange={handleChange} />);

    const slider = screen.getByRole('slider');

    // Using fireEvent directly in the test scope for consistency
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(slider, { target: { value: '15' } });

    expect(handleChange).toHaveBeenCalledWith({ crosshairSize: 15 });
  });
});
