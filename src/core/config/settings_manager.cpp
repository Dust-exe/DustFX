#include "core/config/settings_manager.h"
#include <nlohmann/json.hpp>
#include <iostream>
#include <fstream>
#include <filesystem>

namespace dustfx {

using json = nlohmann::json;

SettingsManager& SettingsManager::Instance() {
    static SettingsManager instance;
    return instance;
}

SettingsManager::SettingsManager() {
    m_settings.currentSettings.gamma = 1.0f;
    m_settings.currentSettings.digitalVibrance = 0;
    m_settings.currentSettings.contrast = 1.0f;
}

bool SettingsManager::LoadFromFile(const std::string& configPath) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_configPath = configPath;

    try {
        if (!std::filesystem::exists(m_configPath)) {
            return false;
        }

        std::ifstream f(m_configPath);
        if (!f.is_open()) return false;

        json j;
        f >> j;

        m_settings.targetMonitorIndex = j.value("targetMonitorIndex", -1);
        m_settings.runOnStartup = j.value("runOnStartup", false);
        m_settings.minimizeToTray = j.value("minimizeToTray", true);
        m_settings.showToastNotifications = j.value("showToastNotifications", true);
        m_settings.playAudioFeedback = j.value("playAudioFeedback", true);
        m_settings.activeProfileId = j.value("activeProfileId", "pvp_contrast");

        if (j.contains("hotkeys")) {
            auto& h = j["hotkeys"];
            m_settings.hotkeys.maxGammaKey = h.value("maxGammaKey", "F11");
            m_settings.hotkeys.vibranceKey = h.value("vibranceKey", "F12");
            m_settings.hotkeys.quickResetKey = h.value("quickResetKey", "F10");
            m_settings.hotkeys.toggleOverlayKey = h.value("toggleOverlayKey", "Alt+X");
            m_settings.hotkeys.toggleCrosshairKey = h.value("toggleCrosshairKey", "Alt+Z");
        }

        if (j.contains("currentSettings")) {
            auto& s = j["currentSettings"];
            m_settings.currentSettings.gamma = s.value("gamma", 1.0f);
            m_settings.currentSettings.digitalVibrance = s.value("digitalVibrance", 0);
            m_settings.currentSettings.brightnessOffset = s.value("brightnessOffset", 0.0f);
            m_settings.currentSettings.contrast = s.value("contrast", 1.0f);
            m_settings.currentSettings.rgbRed = s.value("rgbRed", 1.0f);
            m_settings.currentSettings.rgbGreen = s.value("rgbGreen", 1.0f);
            m_settings.currentSettings.rgbBlue = s.value("rgbBlue", 1.0f);
            m_settings.currentSettings.sharpness = s.value("sharpness", 0.0f);
            m_settings.currentSettings.crosshairEnabled = s.value("crosshairEnabled", false);
            m_settings.currentSettings.crosshairStyle = s.value("crosshairStyle", "cross");
            m_settings.currentSettings.crosshairColor = s.value("crosshairColor", "#00FF66");
            m_settings.currentSettings.crosshairSize = s.value("crosshairSize", 10);
            m_settings.currentSettings.crosshairThickness = s.value("crosshairThickness", 2);
            m_settings.currentSettings.crosshairGap = s.value("crosshairGap", 4);
            m_settings.currentSettings.crosshairDotSize = s.value("crosshairDotSize", 0);
            m_settings.currentSettings.crosshairOutline = s.value("crosshairOutline", 1);
            m_settings.currentSettings.crosshairOpacity = s.value("crosshairOpacity", 1.0f);
        }

        return true;
    } catch (const std::exception& e) {
        std::cerr << "[SettingsManager] Error loading config: " << e.what() << std::endl;
        return false;
    }
}

bool SettingsManager::SaveToFile(const std::string& configPath) {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (!configPath.empty()) {
        m_configPath = configPath;
    }

    try {
        std::filesystem::path p(m_configPath);
        if (p.has_parent_path()) {
            std::filesystem::create_directories(p.parent_path());
        }

        json j;
        j["targetMonitorIndex"] = m_settings.targetMonitorIndex;
        j["runOnStartup"] = m_settings.runOnStartup;
        j["minimizeToTray"] = m_settings.minimizeToTray;
        j["showToastNotifications"] = m_settings.showToastNotifications;
        j["playAudioFeedback"] = m_settings.playAudioFeedback;
        j["activeProfileId"] = m_settings.activeProfileId;

        j["hotkeys"] = {
            {"maxGammaKey", m_settings.hotkeys.maxGammaKey},
            {"vibranceKey", m_settings.hotkeys.vibranceKey},
            {"quickResetKey", m_settings.hotkeys.quickResetKey},
            {"toggleOverlayKey", m_settings.hotkeys.toggleOverlayKey},
            {"toggleCrosshairKey", m_settings.hotkeys.toggleCrosshairKey}
        };

        j["currentSettings"] = {
            {"gamma", m_settings.currentSettings.gamma},
            {"digitalVibrance", m_settings.currentSettings.digitalVibrance},
            {"brightnessOffset", m_settings.currentSettings.brightnessOffset},
            {"contrast", m_settings.currentSettings.contrast},
            {"rgbRed", m_settings.currentSettings.rgbRed},
            {"rgbGreen", m_settings.currentSettings.rgbGreen},
            {"rgbBlue", m_settings.currentSettings.rgbBlue},
            {"sharpness", m_settings.currentSettings.sharpness},
            {"crosshairEnabled", m_settings.currentSettings.crosshairEnabled},
            {"crosshairStyle", m_settings.currentSettings.crosshairStyle},
            {"crosshairColor", m_settings.currentSettings.crosshairColor},
            {"crosshairSize", m_settings.currentSettings.crosshairSize},
            {"crosshairThickness", m_settings.currentSettings.crosshairThickness},
            {"crosshairGap", m_settings.currentSettings.crosshairGap},
            {"crosshairDotSize", m_settings.currentSettings.crosshairDotSize},
            {"crosshairOutline", m_settings.currentSettings.crosshairOutline},
            {"crosshairOpacity", m_settings.currentSettings.crosshairOpacity}
        };

        std::ofstream f(m_configPath);
        if (f.is_open()) {
            f << j.dump(2);
            return true;
        }
    } catch (...) {}

    return false;
}

AppSettings SettingsManager::GetSettings() const {
    std::lock_guard<std::mutex> lock(m_mutex);
    return m_settings;
}

void SettingsManager::SetSettings(const AppSettings& settings) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_settings = settings;
}

DisplaySettings SettingsManager::GetCurrentDisplaySettings() const {
    std::lock_guard<std::mutex> lock(m_mutex);
    return m_settings.currentSettings;
}

void SettingsManager::SetCurrentDisplaySettings(const DisplaySettings& settings) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_settings.currentSettings = settings;
}

HotkeyConfig SettingsManager::GetHotkeyConfig() const {
    std::lock_guard<std::mutex> lock(m_mutex);
    return m_settings.hotkeys;
}

void SettingsManager::SetHotkeyConfig(const HotkeyConfig& config) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_settings.hotkeys = config;
}

int SettingsManager::GetTargetMonitorIndex() const {
    std::lock_guard<std::mutex> lock(m_mutex);
    return m_settings.targetMonitorIndex;
}

void SettingsManager::SetTargetMonitorIndex(int index) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_settings.targetMonitorIndex = index;
}

} // namespace dustfx
