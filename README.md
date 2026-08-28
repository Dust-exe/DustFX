# 🎮 DUSTFX — GPU Display & DCCW Gamma Optimizer

> **High-Performance Hardware GPU Display Calibration, DCCW Gamma Boost, Digital Vibrance, PvP Crosshair Overlay Engine & Auto-Update System**

[![Release](https://img.shields.io/badge/Release-v1.4.0-brightgreen?style=for-the-badge&logo=windows)](https://github.com/Dust-exe/DustFX/releases)
[![License](https://img.shields.io/badge/License-MIT%20%2F%20Proprietary-blue?style=for-the-badge)](LICENSE.txt)
[![Tech](https://img.shields.io/badge/C%2B%2B20-React%20%2F%20Tailwind-purple?style=for-the-badge)](https://dust-studio.com)
[![Status](https://img.shields.io/badge/DirectX%20%2F%20NVAPI-Zero--Lag-fuchsia?style=for-the-badge)](https://dust-studio.com)

[English](#-key-features) | [Türkçe](#-türkçe-kullanım-kılavuzu)

---

## ✨ Key Features (v1.4.0)

### 1. ⚡ Hardware-Level GPU & DCCW Gamma Control
- **DCCW Gamma Boost (0.5x - 3.0x):** Zero-latency night vision lighting powered by Windows GDI GammaRamp and direct hardware color ramps.
- **Dedicated Digital Vibrance (%0 - %100):** Real-time hardware saturation engine with dedicated background DWM message pump & NVAPI hardware acceleration.
- **Edge & Silhouette Contour Contrast (Outline Sharpness):** High-frequency chromatic boundary separation that makes player silhouettes and enemy outlines stand out sharply without halo artifacts.
- **Enhanced CAS Sharpness (Unsharp Mask LUT):** Frequency-separated multi-band sharpening that highlights distant targets and fine textures.
- **Shadow Detail Recovery (Toe Curve):** Lifts dark shadows in tunnels, caves, and dark buildings without washing out highlight contrast (%0 - %100).
- **Kelvin Color Temperature (2700K - 10000K):** Tanner Helland physical color temperature mapping for anti-fatigue warm night filters or icy competitive blue tints.
- **Independent RGB Calibration:** Fine-tune Red, Green, and Blue channels separately.
- **Hotkey Management:** Full custom key bindings with instant reset and one-click key removal (🗑️) support.
- **Multilingual Support:** Instant EN/TR language toggle with English primary default.
- **Dust Studio Tab:** Dedicated creator information, ecosystem hub, and one-click GitHub Star support.

### 2. 🎯 PvP Crosshair Overlay Engine
- **Pixel-Perfect Center Lock:** Lightweight 200x200 transparent, click-through, topmost hardware overlay (`Alt + Z`).
- **8 Distinct Shapes:** Dot, Cross (+), T-Cross, Gap-Cross, X-Cross, Circle (O), Cross-Dot, and Square.
- **Full Customization:** Size (2-40px), thickness (1-10px), center gap (0-30px), center dot size, black outline, custom opacity, and RGB neon colors.

### 3. 🤖 Intelligent Game Detection & Alt+Tab Auto-Reset
- Automatically engages designated profiles when games launch.
- Automatically resets screen colors back to standard Windows defaults on Alt+Tab or game exit to prevent eye strain.

### 4. 🌙 Preset Library & Community Profiles
- **🌙 Night Vision Boost:** Maximum visibility for nighttime tactical operations and dense shadows.
- **🕳️ Cave Illuminator:** Ultra-high 2.5x gamma with deep shadow recovery.
- **🎯 PvP Crisp & Contrast:** Sharp enemy silhouette clarity for competitive shooters (CS2, Valorant, Rust, Tarkov).
- **☀️ Daylight Vivid:** Cinematic 80% saturation boost.
- **👁️ Eye Care Mode:** Gentle warm night filter reducing blue light.
- **Community Share Codes (DUST-COLOR):** One-click import/export of color profile configurations.

### 5. 🔄 GitHub Direct Auto-Updater
- Checks the official `Dust-exe/DustFX` GitHub Releases API in the background.
- "Update Now & Restart" button seamlessly installs updates directly from GitHub.

### 6. 🖥️ Multi-Monitor Management
- Synchronize all displays or apply calibrations independently to your primary gaming monitor.

---

## ⌨️ Default Keyboard Shortcuts

| Hotkey | Action | Description |
|---|---|---|
| **F11** | MAX DCCW GAMMA | Instantly toggles 2.5x Gamma Boost on/off |
| **F12** | Vibrance Toggle | Instantly toggles 75% Digital Vibrance |
| **F10** | Quick Reset | Resets all display settings to Windows defaults |
| **Alt + Z** | Crosshair Toggle | Turns on-screen PvP crosshair overlay on/off |
| **Alt + X** | DustFX HUD | Triggers in-game OSD toast notification |

---

## 🏗️ Architecture & Project Structure

```
DustFX/
├── CMakeLists.txt              # C++20 Build Configuration
├── LICENSE.txt                 # End-User License Agreement (English & Türkçe)
├── src/
│   ├── main.cpp                # WinMain, Tray Icon, Hotkeys & Edge App Host
│   ├── core/
│   │   ├── common.h            # Data structures & settings definitions
│   │   ├── app/                # Main application lifecycle
│   │   ├── gpu/                # Hardware GPU & GDI Gamma controller
│   │   ├── display/            # Monitor enumeration & multi-display handling
│   │   ├── profile/            # Game profile manager & JSON persistence
│   │   ├── hotkey/             # Global async hotkey listener
│   │   ├── process/            # Process watcher & foreground window detection
│   │   ├── config/             # Configuration storage
│   │   └── updater/            # GitHub Releases auto-updater
│   ├── overlay/                # Zero-lag crosshair & OSD toast engine
│   └── server/                 # Embedded HTTP UI Server (127.0.0.1:19840)
    ├── src/
    │   ├── App.tsx             # Main Glassmorphism Dashboard
    │   ├── api.ts              # Backend REST API client
    │   └── components/         # Sliders, Profiles, Crosshair, Monitors, Updates
    └── dist/                   # Bundled production web assets
```

---

## 🚀 Building & Compilation

### Build C++ Windows Executable (MinGW-w64):
```bash
x86_64-w64-mingw32-g++ -std=c++20 -O3 -mwindows \
  -DDUSTFX_WIN32 -DWIN32_LEAN_AND_MEAN \
  -DDUSTFX_VERSION_STRING='"1.2.1"' \
  -I src -I include \
  src/main.cpp src/core/gpu/gpu_controller.cpp \
  src/core/display/monitor_manager.cpp src/core/profile/profile_manager.cpp \
  src/core/hotkey/hotkey_manager.cpp src/core/process/process_watcher.cpp \
  src/core/config/settings_manager.cpp src/core/updater/auto_updater.cpp \
  src/core/app/dustfx_app.cpp src/overlay/overlay_toast.cpp \
  src/server/http_server.cpp resources/dustfx_rc.o \
  -lws2_32 -lgdi32 -luser32 -lshell32 -lole32 -lwininet -lpthread \
  -static -static-libgcc -static-libstdc++ \
  -Wl,--nxcompat -Wl,--dynamicbase -Wl,--high-entropy-va \
  -o DustFX.exe
```

### Build Web Frontend:
```bash
cd web
npm install
npm run build
```

### Build Windows NSIS Installer:
```bash
makensis installer.nsi
```

---

## 🇹🇷 Türkçe Kullanım Kılavuzu

DustFX, Windows DWM ve ekran kartı renk rampalarını doğrudan kontrol ederek sıfır gecikmeli ekran kalibrasyonu, gece görüşü (DCCW Gama), renk doygunluğu (Digital Vibrance) ve şeffaf nişangah (Crosshair Overlay) sağlayan açık kaynaklı bir masaüstü aracıdır.

### 🌟 Öne Çıkan Özellikler:
1. **DCCW Gama & Gece Görüşü (`F11`)**: Tek tuşla anında 2.5x parlaklık artışı; zifiri karanlık yerlerde düşman silüetlerini görünür kılar.
2. **Gelişmiş CAS Keskinleştirme (Unsharp LUT)**: Uzaktaki hedefleri ve çalı/gölge arkasındaki oyuncuları belirginleştirir.
3. **Gölge Detay Kurtarma (%0 - %100)**: Karanlık alanları açarken gökyüzü ve tepe ışıklarını bozmaz.
4. **Kelvin Renk Sıcaklığı (2700K - 10000K)**: Gece göz dinlendirici sıcak ton veya rekabetçi buz mavisi tonlama.
5. **PvP Donanım Nişangahı (`Alt + Z`)**: Ekranın tam merkezine kilitlenen 8 farklı stil ve neon renk seçeneği.
6. **Otomatik Güncelleme**: Uygulama içinden tek tıkla GitHub üzerinden doğrudan güncelleme.
7. **Hızlı Sıfırlama (`F10`)**: Anında varsayılan Windows renk ayarlarına dönüş.

---

## 📄 License & Publisher
- **Publisher**: [Dust Studio](https://dust-studio.com)
- **Repository**: [Dust-exe/DustFX](https://github.com/Dust-exe/DustFX)
- Licensed under the [EULA / Terms](LICENSE.txt). All rights reserved.

<sub>Engineered by **dust.exe** • [dust-studio.com](https://dust-studio.com/)</sub>
