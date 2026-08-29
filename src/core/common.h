#pragma once

#include <string>
#include <vector>
#include <memory>
#include <chrono>
#include <cstdint>
#include <functional>

namespace dustfx {

enum class GpuVendor {
    NVIDIA,
    AMD,
    INTEL,
    GENERIC
};

enum class AutoResetPolicy {
    ON_DESKTOP_FOCUS,  // Auto-reset display when Alt+Tabbing to desktop
    ON_PROCESS_EXIT,    // Reset only when target game process terminates
    NEVER              // Keep active until manual reset
};

struct DisplaySettings {
    float gamma = 1.0f;               // 0.5x - 3.0x (1.0 default)
    int digitalVibrance = 0;           // 0% - 100%
    float brightnessOffset = 0.0f;    // -100% - +100%
    float contrast = 1.0f;            // 0.5x - 2.5x
    float rgbRed = 1.0f;              // 0.5x - 2.0x
    float rgbGreen = 1.0f;            // 0.5x - 2.0x
    float rgbBlue = 1.0f;             // 0.5x - 2.0x
    float sharpness = 0.0f;           // 0.0 - 1.0 (CAS / RIS)
    float colorTemperature = 6500.0f; // 2700K - 10000K
    float shadowDetail = 0.0f;        // 0.0 - 1.0
    float msaaStrength = 0.0f;        // 0.0 - 1.0 (MSAA edge smoothing via DWM matrix)
    float edgeEnhance = 0.0f;         // 0.0 - 1.0 (Edge contour & silhouette contrast boost)
    float bloom = 0.0f;               // 0.0 - 1.0 (Highlight bloom & luminance glow)
    
    // PvP Tools & Crosshair
    bool crosshairEnabled = false;
    std::string crosshairStyle = "gap_cross";
    std::string crosshairColor = "#00FF66";
    int crosshairSize = 10;
    int crosshairThickness = 2;
    int crosshairGap = 4;
    int crosshairDotSize = 0;
    int crosshairOutline = 1;
    float crosshairOpacity = 1.0f;
    
    // Sniper Zoom Lens
    bool sniperZoomEnabled = false;
    float sniperZoomScale = 2.0f;     // 1.2x - 4.0x
    int sniperZoomSize = 260;         // 100px - 500px
    std::string sniperZoomShape = "circle"; // "circle" or "square"
    std::string sniperZoomMode = "hold";    // "hold" or "toggle"
    std::string sniperZoomBorderColor = "#A855F7";
    int sniperZoomBorderWidth = 2;
    bool sniperZoomShowDot = true;
};

struct GameProfile {
    std::string id;
    std::string name;
    std::string icon;
    std::string description;
    std::string exePattern;           // e.g. "FiveM.exe;RustClient.exe;cs2.exe"
    DisplaySettings settings;
    std::string hotkey;               // e.g. "F9", "F10"
    bool autoApplyOnLaunch = true;
    bool isBuiltin = false;
};

struct MonitorInfo {
    int index = 0;
    std::string id;
    std::string name;
    std::string displayName;
    bool isPrimary = true;
    int width = 1920;
    int height = 1080;
    int refreshRate = 144;
    float currentGamma = 1.0f;
    int currentVibrance = 0;
};

struct HotkeyConfig {
    std::string maxGammaKey = "F11";
    std::string vibranceKey = "F12";
    std::string quickResetKey = "F10";
    std::string toggleOverlayKey = "Alt+X";
    std::string toggleCrosshairKey = "Alt+Z";
    std::string sniperZoomKey = "V";
};

struct ReleaseInfo {
    std::string tagName;       // e.g. "v1.1.0"
    std::string version;       // e.g. "1.1.0"
    std::string htmlUrl;       // GitHub release page
    std::string downloadUrl;   // .exe download url
    std::string releaseNotes;  // Changelog
    std::string publishedAt;   // Date string
    bool isNewer = false;
};

struct AppSettings {
    int targetMonitorIndex = -1;       // -1 = All monitors, >= 0 specific monitor
    AutoResetPolicy resetPolicy = AutoResetPolicy::ON_DESKTOP_FOCUS;
    bool runOnStartup = false;
    bool minimizeToTray = true;
    bool showToastNotifications = true;
    bool playAudioFeedback = true;
    std::string activeProfileId = "default";
    HotkeyConfig hotkeys;
    DisplaySettings currentSettings;
};

} // namespace dustfx

#ifndef DUSTFX_VERSION_STRING
#define DUSTFX_VERSION_STRING "1.7.0"
#endif

