export interface DisplaySettings {
  gamma: number;
  digitalVibrance: number;
  brightnessOffset: number;
  contrast: number;
  rgbRed: number;
  rgbGreen: number;
  rgbBlue: number;
  sharpness: number;
  colorTemperature: number;
  shadowDetail: number;
  msaaStrength?: number;       // 0.0 - 1.0 (Legacy alias)
  edgeEnhance?: number;        // 0.0 - 1.0 (Edge contour & silhouette sharpness boost)
  bloom?: number;              // 0.0 - 1.0 (Highlight bloom & luminance glow)
  crosshairEnabled: boolean;
  crosshairStyle: 'dot' | 'cross' | 'circle' | 'gap-cross' | 'x-cross' | 't-cross' | 'cross-dot' | 'square';
  crosshairColor: string;
  crosshairSize: number;
  crosshairThickness?: number;
  crosshairGap?: number;
  crosshairDotSize?: number;
  crosshairOutline?: number;
  crosshairOpacity?: number;
  
  // Sniper Zoom Lens
  sniperZoomEnabled?: boolean;
  sniperZoomScale?: number;     // 1.2x - 4.0x
  sniperZoomSize?: number;      // 100px - 500px
  sniperZoomShape?: 'circle' | 'square';
  sniperZoomMode?: 'hold' | 'toggle';
  sniperZoomBorderColor?: string;
  sniperZoomBorderWidth?: number;
  sniperZoomShowDot?: boolean;
}

export interface SavedCrosshairPreset {
  id: string;
  name: string;
  createdAt: string;
  style: 'dot' | 'cross' | 'circle' | 'gap-cross' | 'x-cross' | 't-cross' | 'cross-dot' | 'square';
  color: string;
  size: number;
  thickness: number;
  gap: number;
  dotSize: number;
  outline: number;
  opacity: number;
}

export interface GameProfile {
  id: string;
  name: string;
  icon: string;
  description: string;
  exePattern: string;
  settings: DisplaySettings;
  hotkey: string;
  autoApplyOnLaunch: boolean;
  isBuiltin: boolean;
}

export interface MonitorInfo {
  index: number;
  name: string;
  displayName: string;
  isPrimary: boolean;
  width: number;
  height: number;
  refreshRate: number;
}

export interface ReleaseInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  tagName: string;
  htmlUrl: string;
  downloadUrl: string;
  releaseNotes: string;
  publishedAt: string;
}

export interface AppStatus {
  status: string;
  version: string;
  gpuVendor: string;
  activeProfileId: string;
  targetMonitorIndex: number;
  currentSettings: DisplaySettings;
  monitors: MonitorInfo[];
}

export interface HotkeyConfig {
  maxGammaKey: string;
  vibranceKey: string;
  quickResetKey: string;
  toggleOverlayKey: string;
  toggleCrosshairKey: string;
  sniperZoomKey?: string;
}
