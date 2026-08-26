export interface DisplaySettings {
  gamma: number;
  digitalVibrance: number;
  brightnessOffset: number;
  contrast: number;
  rgbRed: number;
  rgbGreen: number;
  rgbBlue: number;
  sharpness: number;
  colorTemperature: number;  // 2700 - 10000 Kelvin
  shadowDetail: number;      // 0.0 - 1.0
  crosshairEnabled: boolean;
  crosshairStyle: 'dot' | 'cross' | 'circle' | 'gap-cross' | 'x-cross' | 't-cross' | 'cross-dot' | 'square';
  crosshairColor: string;
  crosshairSize: number;            // Uzunluk (Length)
  crosshairThickness?: number;      // Kalınlık (Thickness)
  crosshairGap?: number;            // Boşluk (Gap)
  crosshairDotSize?: number;        // Nokta boyutu (Dot size)
  crosshairOutline?: number;        // Dış çizgi kalınlığı (Outline)
  crosshairOpacity?: number;        // Opaklık (0.2 - 1.0)
  sniperZoomEnabled?: boolean;
  sniperZoomFactor?: number;
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
}
