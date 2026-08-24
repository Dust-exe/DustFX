#pragma once

#include "core/common.h"
#include <string>
#include <mutex>

namespace dustfx {

class SettingsManager {
public:
    static SettingsManager& Instance();

    bool LoadFromFile(const std::string& configPath = "config/dustfx_config.json");
    bool SaveToFile(const std::string& configPath = "config/dustfx_config.json");

    AppSettings GetSettings() const;
    void SetSettings(const AppSettings& settings);

    DisplaySettings GetCurrentDisplaySettings() const;
    void SetCurrentDisplaySettings(const DisplaySettings& settings);

    HotkeyConfig GetHotkeyConfig() const;
    void SetHotkeyConfig(const HotkeyConfig& config);

    int GetTargetMonitorIndex() const;
    void SetTargetMonitorIndex(int index);

private:
    SettingsManager();
    ~SettingsManager() = default;

    mutable std::mutex m_mutex;
    AppSettings m_settings;
    std::string m_configPath = "config/dustfx_config.json";
};

} // namespace dustfx
