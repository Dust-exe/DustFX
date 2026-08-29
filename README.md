# DUSTFX — GPU Display & DCCW Gamma Optimizer

> High-Performance Hardware GPU Display Calibration, DCCW Gamma Boost, Digital Vibrance, PvP Crosshair Overlay Engine & Auto-Update System

[![Release](https://img.shields.io/badge/Release-v2.0.1-brightgreen?style=for-the-badge&logo=windows)](https://github.com/Dust-exe/DustFX/releases)
[![License](https://img.shields.io/badge/License-GPL--3.0-blue?style=for-the-badge)](LICENSE.txt)
[![CPU Usage](https://img.shields.io/badge/CPU-%3C0.1%25-brightgreen?style=for-the-badge)](https://dust-studio.com)
[![RAM Usage](https://img.shields.io/badge/RAM-%3C15MB-brightgreen?style=for-the-badge)](https://dust-studio.com)
[![Tech](https://img.shields.io/badge/C%2B%2B20-React%20%2F%20Tailwind-purple?style=for-the-badge)](https://dust-studio.com)
[![Status](https://img.shields.io/badge/DirectX%20%2F%20NVAPI-Zero--Lag-fuchsia?style=for-the-badge)](https://dust-studio.com)

[English](#key-features) | [Performance & Resource Footprint](#performance--resource-footprint) | [Türkçe](#türkçe-kullanım-kılavuzu)

---

## ⚡ Performance & Resource Footprint

DustFX is engineered from the ground up in native C++20 for maximum gaming performance. Unlike traditional screen filters or ReShade hooks that inject heavy post-processing shaders into game render pipelines, DustFX applies hardware color LUTs directly through the Windows Desktop Window Manager (DWM) and GPU driver interfaces.

- **CPU Utilization:** **< 0.1%** background idle load (zero impact on CPU-bound competitive games).
- **RAM Footprint:** **< 15 MB RAM** (ultra-lightweight memory profile).
- **GPU Overhead:** **0 FPS Loss (0.0 ms extra input latency)**.
- **Anti-Cheat Safe:** Fully non-invasive external architecture.

| Feature / Metric | DustFX (Native C++20) | ReShade / Heavy Game Overlays |
|---|---|---|
| **CPU Impact** | **< 0.1%** | 2% – 8% |
| **Memory (RAM)** | **< 15 MB** | 150 MB – 500 MB |
| **FPS Drop** | **0 FPS (Zero Lag)** | 5 – 25 FPS Loss |
| **Game Injection** | **None (External DWM/GDI)** | Hook / DLL Injection |
| **Anti-Cheat Safety** | **100% Compliant** | Risk of Third-Party Flags |

---

## Key Features (v2.0.1)

### 1. Hardware-Level GPU & DCCW Gamma Control
- **DCCW Gamma Boost (0.5x - 3.0x):** Zero-latency night vision lighting powered by Windows GDI GammaRamp and direct hardware color ramps.
- **Dedicated Digital Vibrance (0% - 100%):** Real-time hardware saturation engine with dedicated background DWM message pump & NVAPI hardware acceleration.
- **Highlight Bloom Glow (0% - 100%):** High-luminance knee expansion filter that makes enemy silhouettes, neon lights, and muzzle flashes luminous.
- **Edge & Silhouette Contour Contrast:** High-frequency chromatic boundary separation that makes player silhouettes and enemy outlines stand out sharply without halo artifacts.
- **Enhanced CAS Sharpness (Unsharp Mask LUT):** Frequency-separated multi-band sharpening that highlights distant targets and fine textures.
- **Shadow Detail Recovery (Toe Curve):** Lifts dark shadows in tunnels, caves, and dark buildings without washing out highlight contrast (0% - 100%).
- **Kelvin Color Temperature (2700K - 10000K):** Physical color temperature mapping for anti-fatigue warm night filters or icy competitive blue tints.
- **Independent RGB Calibration:** Fine-tune Red, Green, and Blue channels separately.
- **Hotkey Management:** Custom key bindings with instant reset and one-click key removal support.
- **Multilingual Support:** Instant EN/TR language toggle with English primary default.
- **Dust Studio Hub:** Ecosystem overview with project details for Dust-vpn, DustFX, and DustReplay.

### 2. PvP Crosshair & Sniper Zoom Lens Overlay
- **Sniper Zoom Lens (Screen Center Magnifier):** Hardware-accelerated center scope (1.2x – 4.0x zoom, 100px – 500px diameter, circle/square shape, hold/toggle modes).
- **Crosshair Zoom Isolation (CRITICAL):** When the crosshair is active during sniper zoom, the crosshair is rendered on a top layer ABOVE the zoom buffer at 1x resolution, ensuring it is never blurred or distorted.
- **Pixel-Perfect Center Lock:** Lightweight 200x200 transparent, click-through, topmost hardware overlay (`Alt + Z`).
- **8 Distinct Shapes:** Dot, Cross (+), T-Cross, Gap-Cross, X-Cross, Circle (O), Cross-Dot, and Square.
- **Named Custom Presets:** Save custom crosshair designs with personalized names and live SVG previews.

### 3. Intelligent Game Detection & Auto-Reset
- Automatically engages designated profiles when games launch.
- Automatically resets screen colors back to standard Windows defaults on Alt+Tab or game exit to prevent eye strain.

### 4. Preset Library & Community Profiles
- **Night Vision Boost:** Maximum visibility for nighttime tactical operations and dense shadows.
- **Cave Illuminator:** Ultra-high 2.5x gamma with deep shadow recovery.
- **PvP Crisp & Contrast:** Sharp enemy silhouette clarity for competitive shooters (CS2, Valorant, Rust, Tarkov).
- **Daylight Vivid:** Cinematic 80% saturation boost.
- **Eye Care Mode:** Gentle warm night filter reducing blue light.
- **Community Share Codes (DUST-COLOR):** One-click import/export of color profile configurations.

### 5. GitHub Direct Auto-Updater
- Checks the official `Dust-exe/DustFX` GitHub Releases API in the background.
- Multi-tier download engine with automatic background termination of older versions during setup.

### 6. Multi-Monitor Management
- Synchronize all displays or apply calibrations independently to your primary gaming monitor.

---

## Default Keyboard Shortcuts

| Hotkey | Action | Description |
|---|---|---|
| **F11** | MAX DCCW GAMMA | Instantly toggles 2.5x Gamma Boost on/off |
| **F12** | Vibrance Toggle | Instantly toggles 75% Digital Vibrance |
| **F10** | Quick Reset | Resets all display settings to Windows defaults |
| **V** | Sniper Zoom Lens | Holds or toggles the hardware center zoom magnifier |
| **Alt + Z** | Crosshair Toggle | Turns on-screen PvP crosshair overlay on/off |
| **Alt + X** | DustFX HUD | Triggers in-game OSD toast notification |

---

## Installation & Setup

Download the official setup installer from the [Releases](https://github.com/Dust-exe/DustFX/releases) page:

- **Installer:** `DustFX_Setup.exe`

---

## Building & Compilation

### Build C++ Windows Executable (MinGW-w64):
```bash
x86_64-w64-mingw32-g++ -std=c++20 -O3 -mwindows \
  -DDUSTFX_WIN32 -DWIN32_LEAN_AND_MEAN \
  -I src -I include \
  src/main.cpp \
  src/core/gpu/gpu_controller.cpp \
  src/core/display/monitor_manager.cpp \
  src/core/profile/profile_manager.cpp \
  src/core/hotkey/hotkey_manager.cpp \
  src/core/process/process_watcher.cpp \
  src/core/config/settings_manager.cpp \
  src/core/updater/auto_updater.cpp \
  src/core/app/dustfx_app.cpp \
  src/overlay/overlay_toast.cpp \
  src/server/http_server.cpp \
  resources/dustfx_rc.o \
  -lws2_32 -lgdi32 -luser32 -lshell32 -lole32 -lwininet -lurlmon -lpthread \
  -static -static-libgcc -static-libstdc++ \
  -o DustFX.exe
```

### Build NSIS Installer:
```bash
makensis installer.nsi
```

---

## Türkçe Kullanım Kılavuzu & Performans Detayları

DustFX, doğrudan Windows donanım kompozitörü (DWM), GDI GammaRamp ve NVIDIA NVAPI API'leri üzerinden çalışan ultra-düşük gecikmeli ekran kalibrasyon ve PvP nişangah yazılımıdır.

### 🚀 Ultra Düşük Kaynak Tüketimi (Lightweight & Zero-Lag)
- **Minimum İşlemci (CPU) Kullanımı:** Arka planda çalışırken yalnızca **%0.1'den daha az** CPU kullanır; rekabetçi oyunlarda FPS kaybı yaşatmaz.
- **Minimum Bellek (RAM) Tüketimi:** Yalnızca **< 15 MB RAM** tüketir.
- **Sıfır Gecikme (0 ms Input Lag):** Oyunların içine DLL enjekte eden ReShade gibi ağır gölgelendirici (shader) yazılımlarının aksine doğrudan donanımsal renk rampalarını değiştirdiği için **0 FPS kaybı** ile çalışır.

### 🎮 Kısayol Tuşları:
- **Kurulum:** `DustFX_Setup.exe` dosyasını çalıştırarak kurulumu tamamlayın.
- **Gece Görüşü:** `F11` tuşu ile anlık 2.5x donanımsal gama aydınlatması açıp kapatabilirsiniz.
- **Canlılık:** `F12` tuşu ile %75 Digital Vibrance renk doygunluğunu aktif edebilirsiniz.
- **Nişangah:** `Alt + Z` tuşu ile özelleştirilebilir PvP nişangahını ekrana yansıtabilirsiniz.
- **Sıfırlama:** `F10` tuşu ile tüm ayarları anında varsayılan Windows ayarlarına döndürebilirsiniz.

---

## Legal & Anti-Cheat Compliance Notice

- **Non-Invasive Architecture:** DustFX operates strictly external to games via standard Microsoft Windows Desktop Window Manager (DWM) and GDI Gamma APIs. It does not inject DLLs, modify memory, or tamper with third-party game files.
- **Anti-Cheat & Account Liability Disclaimer:** While DustFX is technically non-invasive and does not trigger anti-cheat bans under normal conditions, all users acknowledge that third-party game publishers and anti-cheat systems (Vanguard, EAC, BattlEye, VAC, Ricochet, etc.) enforce independent policies. In the unlikely event of any account penalty or ban, Dust Studio (Dust-exe) holds **zero liability**; all usage is at the user's sole risk.

---

## License

Copyright (C) 2026 Dust Studio (Dust-exe). All rights reserved. Distributed under the terms of the GNU General Public License v3.0 (GPL-3.0). See [LICENSE.txt](LICENSE.txt) for full legal terms.
