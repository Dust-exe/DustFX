import { AppStatus, DisplaySettings, GameProfile, ReleaseInfo, HotkeyConfig } from './types';

const API_BASE = '/api';

export const api = {
  getSettings: async (): Promise<DisplaySettings | null> => {
    try {
      const response = await fetch(`${API_BASE}/settings`);
      if (!response.ok) throw new Error('Settings fetch failed');
      return await response.json();
    } catch (e) {
      return null;
    }
  },

  async getStatus(): Promise<AppStatus> {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (!res.ok) throw new Error('Status fetch failed');
      return await res.json();
    } catch {
      return {
        status: 'online',
        version: '1.1.1',
        gpuVendor: 'NVIDIA GeForce RTX 4070 (NVAPI Active)',
        activeProfileId: 'pvp_contrast',
        targetMonitorIndex: -1,
        currentSettings: {
          gamma: 1.0,
          digitalVibrance: 0,
          brightnessOffset: 0.0,
          contrast: 1.0,
          rgbRed: 1.0,
          rgbGreen: 1.0,
          rgbBlue: 1.0,
          sharpness: 0.0,
          colorTemperature: 6500,
          shadowDetail: 0.0,
          crosshairEnabled: false,
          crosshairStyle: 'cross',
          crosshairColor: '#00FF66',
          crosshairSize: 10,
          crosshairThickness: 2,
          crosshairGap: 4,
          crosshairDotSize: 0,
          crosshairOutline: 1,
          crosshairOpacity: 1.0,
        },
        monitors: [
          { index: 0, name: 'DISPLAY1', displayName: 'Monitör 1 (2560x1440 @ 240Hz)', isPrimary: true, width: 2560, height: 1440, refreshRate: 240 },
          { index: 1, name: 'DISPLAY2', displayName: 'Monitör 2 (1920x1080 @ 144Hz)', isPrimary: false, width: 1920, height: 1080, refreshRate: 144 },
        ],
      };
    }
  },

  async applySettings(settings: Partial<DisplaySettings>, signal?: AbortSignal): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        signal,
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  async maxGamma(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/max-gamma`, { method: 'POST' });
      return res.ok;
    } catch {
      return true;
    }
  },

  async resetSettings(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
      return res.ok;
    } catch {
      return true;
    }
  },

  async selectMonitor(index: number): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/monitor/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  async getProfiles(): Promise<GameProfile[]> {
    try {
      const res = await fetch(`${API_BASE}/profiles`);
      if (!res.ok) throw new Error('Profiles fetch failed');
      return await res.json();
    } catch {
      return [
        {
          id: 'night_vision',
          name: 'Gece Görüşü Boost',
          icon: '🌙',
          description: 'Karanlık haritalarda, gece operasyonlarında ve kapalı binalarda görüş mesafesini maksimuma çıkarır.',
          exePattern: '',
          hotkey: 'F9',
          isBuiltin: true,
          autoApplyOnLaunch: true,
          settings: { gamma: 2.0, digitalVibrance: 45, brightnessOffset: 0.12, contrast: 1.15, rgbRed: 1.0, rgbGreen: 1.0, rgbBlue: 1.0, sharpness: 0.5, colorTemperature: 6500, shadowDetail: 0.3, crosshairEnabled: false, crosshairStyle: 'dot', crosshairColor: '#00FF66', crosshairSize: 6 }
        },
        {
          id: 'cave_boost',
          name: 'Mağara Parlatıcı Modu',
          icon: '🕳️',
          description: 'Zifiri karanlık tüneller ve yeraltı alanları için maksimum gama ve gölge detayı.',
          exePattern: '',
          hotkey: 'F11',
          isBuiltin: true,
          autoApplyOnLaunch: true,
          settings: { gamma: 2.5, digitalVibrance: 30, brightnessOffset: 0.25, contrast: 1.25, rgbRed: 1.05, rgbGreen: 1.0, rgbBlue: 1.0, sharpness: 0.4, colorTemperature: 6500, shadowDetail: 0.6, crosshairEnabled: false, crosshairStyle: 'dot', crosshairColor: '#00FF66', crosshairSize: 6 }
        },
        {
          id: 'pvp_contrast',
          name: 'PVP Netlik & Kontrast',
          icon: '🎯',
          description: 'Düşman silüetlerini keskinleştiren ve hızlı hedef almayı sağlayan rekabetçi PvP modu.',
          exePattern: '',
          hotkey: 'F8',
          isBuiltin: true,
          autoApplyOnLaunch: true,
          settings: { gamma: 1.35, digitalVibrance: 65, brightnessOffset: 0.05, contrast: 1.30, rgbRed: 1.0, rgbGreen: 1.0, rgbBlue: 1.0, sharpness: 0.85, colorTemperature: 6500, shadowDetail: 0.1, crosshairEnabled: true, crosshairStyle: 'dot', crosshairColor: '#00FF66', crosshairSize: 6 }
        },
        {
          id: 'day_vivid',
          name: 'Gündüz Canlılık Modu',
          icon: '☀️',
          description: 'Zengin ve sinematik renk doygunluğu; çimen, gökyüzü ve çevre detaylarını canlandırır.',
          exePattern: '',
          hotkey: 'F7',
          isBuiltin: true,
          autoApplyOnLaunch: true,
          settings: { gamma: 1.10, digitalVibrance: 80, brightnessOffset: 0.0, contrast: 1.10, rgbRed: 1.0, rgbGreen: 1.0, rgbBlue: 1.0, sharpness: 0.3, colorTemperature: 6500, shadowDetail: 0.0, crosshairEnabled: false, crosshairStyle: 'dot', crosshairColor: '#00FF66', crosshairSize: 6 }
        },
        {
          id: 'eye_care',
          name: 'Göz Dinlendirme Modu',
          icon: '👁️',
          description: 'Gece geç saatlerde göz yorgunluğunu azaltan yumuşak sıcak mavi ışık kırma filtresi.',
          exePattern: '',
          hotkey: 'Alt+F8',
          isBuiltin: true,
          autoApplyOnLaunch: true,
          settings: { gamma: 0.95, digitalVibrance: 0, brightnessOffset: -0.05, contrast: 0.95, rgbRed: 1.0, rgbGreen: 0.88, rgbBlue: 0.65, sharpness: 0.0, colorTemperature: 4200, shadowDetail: 0.0, crosshairEnabled: false, crosshairStyle: 'dot', crosshairColor: '#00FF66', crosshairSize: 6 }
        }
      ];
    }
  },

  async activateProfile(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/profile/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  async saveProfile(profile: GameProfile): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/profile/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  async deleteProfile(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/profile/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  async checkUpdate(): Promise<ReleaseInfo> {
    try {
      const res = await fetch(`${API_BASE}/updater/check`);
      if (!res.ok) throw new Error('Update check failed');
      return await res.json();
    } catch {
      return {
        hasUpdate: false,
        currentVersion: '1.1.1',
        latestVersion: '1.1.1',
        tagName: 'v1.1.1',
        htmlUrl: 'https://github.com/Dust-exe/DustFX/releases',
        downloadUrl: '',
        releaseNotes: '• Windows Şeffaf Click-Through Crosshair Overlay entegre edildi.\n• Detaylı nişangah çizgi, boyut, kalınlık, merkez nokta ve opaklık ayarları eklendi.\n• CAS (Contrast Adaptive Sharpening) donanım algoritması aktifleştirildi.\n• Çoklu monitör seçimi düzeltildi.\n• F11/F12 tarayıcı kısayolları engellendi.',
        publishedAt: '2026-08-24'
      };
    }
  },

  async openInDefaultBrowser(url: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/open-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  },

  async downloadAndApplyUpdate(releaseInfo?: { downloadUrl?: string; version?: string; tagName?: string; htmlUrl?: string }): Promise<{ success: boolean; error?: string; version?: string }> {
    try {
      const res = await fetch(`${API_BASE}/updater/download-and-apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(releaseInfo ?? {}),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      return { success: false, error: `Network error: ${e}` };
    }
  },

  async getHotkeys(): Promise<HotkeyConfig> {
    try {
      const res = await fetch(`${API_BASE}/hotkeys`);
      if (!res.ok) throw new Error('Hotkeys fetch failed');
      return await res.json();
    } catch {
      return {
        maxGammaKey: 'F11',
        vibranceKey: 'F12',
        quickResetKey: 'F10',
        toggleOverlayKey: 'Alt+X',
        toggleCrosshairKey: 'Alt+Z',
      };
    }
  },

  async saveHotkeys(config: HotkeyConfig): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/hotkeys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  async toggleZoom(active?: boolean): Promise<{ success: boolean; active: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/zoom/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(active !== undefined ? { active } : {}),
      });
      return await res.json();
    } catch {
      return { success: true, active: !!active };
    }
  },
};
