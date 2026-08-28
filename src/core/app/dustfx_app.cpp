#include "core/app/dustfx_app.h"
#include "core/gpu/gpu_controller.h"
#include "core/display/monitor_manager.h"
#include "core/profile/profile_manager.h"
#include "core/config/settings_manager.h"
#include "core/hotkey/hotkey_manager.h"
#include "core/process/process_watcher.h"
#include "core/updater/auto_updater.h"
#include "overlay/overlay_toast.h"
#include "server/http_server.h"

#include <iostream>

namespace dustfx {

DustFxApp& DustFxApp::Instance() {
    static DustFxApp instance;
    return instance;
}

DustFxApp::DustFxApp() = default;

DustFxApp::~DustFxApp() {
    Stop();
}

bool DustFxApp::Initialize() {
    std::cout << "==========================================" << std::endl;
    std::cout << "       DUSTFX — GPU & Display Optimizer   " << std::endl;
    std::cout << "   Version " << DUSTFX_VERSION_STRING << " | Dust Studio       " << std::endl;
    std::cout << "==========================================" << std::endl;

    // 1. Settings
    SettingsManager::Instance().LoadFromFile();

    // 2. GPU & Monitor
    GpuController::Instance().Initialize();
    MonitorManager::Instance().RefreshMonitors();

    // 3. Profiles
    ProfileManager::Instance().Initialize();

    // 4. Hotkeys
    HotkeyManager::Instance().SetConfig(SettingsManager::Instance().GetHotkeyConfig());
    HotkeyManager::Instance().RegisterCallback([this](HotkeyAction action, const std::string& param, bool isKeyDown) {
        HandleHotkey(action, param, isKeyDown);
    });
    HotkeyManager::Instance().Start();

    // 5. Process Watcher (Auto Game Detect & Alt+Tab Reset)
    ProcessWatcher::Instance().Start(
        [this](const std::string& processName, bool isForeground) {
            HandleProcessEvent(processName, isForeground);
        }
    );

    // 6. Overlay & OSD
    OverlayToast::Instance().Initialize();

    // Restore and apply saved settings on startup (Gamma, Crosshair, Vibrance, etc.)
    DisplaySettings savedSettings = SettingsManager::Instance().GetCurrentDisplaySettings();
    int targetMon = SettingsManager::Instance().GetTargetMonitorIndex();
    GpuController::Instance().ApplySettings(savedSettings, targetMon);
    OverlayToast::Instance().UpdateCrosshair(savedSettings);

    // 7. Auto Updater (Watching Dust-exe/DustFX - every 10 minutes)
    AutoUpdater::Instance().Configure("Dust-exe", "DustFX", DUSTFX_VERSION_STRING);
    AutoUpdater::Instance().StartBackgroundChecker(
        [this](bool available, const ReleaseInfo& info) {
            OnUpdateDetected(available, info);
        },
        std::chrono::minutes(10)
    );

    // 8. HTTP UI Server
    HttpServer::Instance().Start(19840, "./web/dist");

    return true;
}

void DustFxApp::Start() {
    if (m_running.load()) return;
    m_running.store(true);
    std::cout << "[DustFxApp] DustFX is running. Press Alt+X for overlay, F11 for Max Gamma." << std::endl;
}

void DustFxApp::Stop() {
    if (m_running.load()) {
        m_running.store(false);
        GpuController::Instance().ResetToDefault(-1);
        HotkeyManager::Instance().Stop();
        ProcessWatcher::Instance().Stop();
        AutoUpdater::Instance().StopBackgroundChecker();
        OverlayToast::Instance().Shutdown();
        HttpServer::Instance().Stop();
        GpuController::Instance().Shutdown();
    }
}

void DustFxApp::ApplyProfile(const std::string& profileId) {
    GameProfile p = ProfileManager::Instance().GetProfileById(profileId);
    if (!p.id.empty()) {
        ProfileManager::Instance().SetActiveProfileId(p.id);
        int targetMon = SettingsManager::Instance().GetTargetMonitorIndex();
        GpuController::Instance().ApplySettings(p.settings, targetMon);
        SettingsManager::Instance().SetCurrentDisplaySettings(p.settings);
        OverlayToast::Instance().ShowToast(p.icon + " " + p.name, "Profil Aktif");
    }
}

void DustFxApp::QuickMaxGamma() {
    m_maxGammaActive = !m_maxGammaActive;
    if (m_maxGammaActive) {
        DisplaySettings s = GpuController::Instance().GetCurrentSettings();
        s.gamma = 2.5f;
        GpuController::Instance().ApplySettings(s);
        SettingsManager::Instance().SetCurrentDisplaySettings(s);
        OverlayToast::Instance().ShowToast("🔥 MAX DCCW GAMA", "Gama: 2.5x");
    } else {
        QuickReset();
    }
}

void DustFxApp::QuickReset() {
    m_maxGammaActive = false;
    m_vibranceActive = false;
    DisplaySettings s;
    GpuController::Instance().ResetToDefault(-1);
    SettingsManager::Instance().SetCurrentDisplaySettings(s);
    OverlayToast::Instance().ShowToast("🔄 AYARLAR SIFIRLANDI", "Varsayılan Windows Renkleri");
}

void DustFxApp::ToggleCrosshair() {
    m_crosshairActive = !m_crosshairActive;
    DisplaySettings s = GpuController::Instance().GetCurrentSettings();
    s.crosshairEnabled = m_crosshairActive;
    SettingsManager::Instance().SetCurrentDisplaySettings(s);
    OverlayToast::Instance().ToggleCrosshair(m_crosshairActive);
    OverlayToast::Instance().ShowToast("🎯 NİŞANGAH (CROSSHAIR)", m_crosshairActive ? "AÇIK" : "KAPALI");
}

void DustFxApp::HandleHotkey(HotkeyAction action, const std::string& param, bool isKeyDown) {
    (void)param;

    // For Sniper Zoom Hold, process both KeyDown and KeyUp events
    if (action == HotkeyAction::SNIPER_ZOOM_HOLD) {
        bool active = isKeyDown;
        if (active != OverlayToast::Instance().IsSniperZoomActive()) {
            OverlayToast::Instance().ToggleSniperZoom(active);
            if (active) {
                OverlayToast::Instance().ShowToast("🔭 SNIPER ZOOM", "AÇIK");
            }
        }
        return;
    }

    // For all other toggles, ONLY trigger on KeyDown to prevent double-firing
    if (!isKeyDown) return;

    switch (action) {
        case HotkeyAction::MAX_GAMMA_TOGGLE:
            QuickMaxGamma();
            break;
        case HotkeyAction::VIBRANCE_TOGGLE: {
            m_vibranceActive = !m_vibranceActive;
            DisplaySettings s = GpuController::Instance().GetCurrentSettings();
            s.digitalVibrance = m_vibranceActive ? 75 : 0;
            GpuController::Instance().ApplySettings(s);
            SettingsManager::Instance().SetCurrentDisplaySettings(s);
            OverlayToast::Instance().ShowToast("🎨 DIGITAL VIBRANCE", m_vibranceActive ? "%75 CANLILIK" : "KAPALI");
            break;
        }
        case HotkeyAction::QUICK_RESET:
            QuickReset();
            break;
        case HotkeyAction::TOGGLE_CROSSHAIR:
            ToggleCrosshair();
            break;
        case HotkeyAction::TOGGLE_OVERLAY:
            OverlayToast::Instance().ShowToast("🎮 DUSTFX PANEL", "http://127.0.0.1:19840");
            break;
        case HotkeyAction::CUSTOM_PROFILE_TRIGGER:
            if (!param.empty()) {
                ApplyProfile(param);
            }
            break;
        default:
            break;
    }
}

void DustFxApp::HandleProcessEvent(const std::string& processName, bool isForeground) {
    if (!isForeground || processName.empty()) return;

    GameProfile matched = ProfileManager::Instance().GetProfileByExe(processName);
    if (!matched.id.empty()) {
        std::cout << "[DustFxApp] 🎮 Game detected: " << processName << " -> Applying " << matched.name << std::endl;
        ApplyProfile(matched.id);
    } else {
        // If desktop/explorer focused and policy is auto reset
        if (processName == "explorer.exe" || processName == "dwm.exe") {
            auto settings = SettingsManager::Instance().GetSettings();
            if (settings.resetPolicy == AutoResetPolicy::ON_DESKTOP_FOCUS) {
                GpuController::Instance().ResetToDefault(-1);
            }
        }
    }
}

void DustFxApp::OnUpdateDetected(bool available, const ReleaseInfo& info) {
    if (available) {
        std::string msg = "Yeni DustFX v" + info.version + " mevcut!";
        OverlayToast::Instance().ShowToast("🔔 GÜNCELLEME BULUNDU", msg, 8);
        std::cout << "[DustFxApp] Update detected: v" << info.version << " at " << info.htmlUrl << std::endl;
    }
}

} // namespace dustfx
