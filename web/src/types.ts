export interface DisplaySettings {
  gamma: number;
  digitalVibrance: number;
  brightnessOffset: number;
  contrast: number;
  rgbRed: number;
  rgbGreen: number;
  rgbBlue: number;
  sharpness: number;
  crosshairEnabled: boolean;
  crosshairStyle: 'dot' | 'cross' | 'circle' | 'gap-cross' | 'x-cross' | 't-cross' | 'cross-dot' | 'square';
  crosshairColor: string;
  crosshairSize: number;
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
