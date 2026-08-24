#include "core/display/monitor_manager.h"
#include <iostream>

#ifdef _WIN32
#include <windows.h>
#endif

namespace dustfx {

MonitorManager& MonitorManager::Instance() {
    static MonitorManager instance;
    return instance;
}

MonitorManager::MonitorManager() {
    RefreshMonitors();
}

void MonitorManager::RefreshMonitors() {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_monitors.clear();

#ifdef _WIN32
    DISPLAY_DEVICEA dd;
    dd.cb = sizeof(dd);
    int devIndex = 0;

    while (EnumDisplayDevicesA(NULL, devIndex, &dd, 0)) {
        if (dd.StateFlags & DISPLAY_DEVICE_ATTACHED_TO_DESKTOP) {
            MonitorInfo info;
            info.index = devIndex;
            info.id = dd.DeviceName;
            info.name = dd.DeviceString;
            info.displayName = "Monitör " + std::to_string(devIndex + 1) + " (" + dd.DeviceString + ")";
            info.isPrimary = (dd.StateFlags & DISPLAY_DEVICE_PRIMARY_DEVICE) != 0;

            DEVMODEA dm;
            dm.dmSize = sizeof(dm);
            if (EnumDisplaySettingsA(dd.DeviceName, ENUM_CURRENT_SETTINGS, &dm)) {
                info.width = dm.dmPelsWidth;
                info.height = dm.dmPelsHeight;
                info.refreshRate = dm.dmDisplayFrequency;
            }

            m_monitors.push_back(info);
        }
        devIndex++;
    }
#endif

    // Fallback if none enumerated
    if (m_monitors.empty()) {
        MonitorInfo fallback;
        fallback.index = 0;
        fallback.id = "DISPLAY1";
        fallback.name = "Ana Ekran (Gaming Display)";
        fallback.displayName = "Monitör 1 (1920x1080 @ 144Hz)";
        fallback.isPrimary = true;
        fallback.width = 1920;
        fallback.height = 1080;
        fallback.refreshRate = 144;
        m_monitors.push_back(fallback);
    }
}

std::vector<MonitorInfo> MonitorManager::GetMonitors() const {
    std::lock_guard<std::mutex> lock(m_mutex);
    return m_monitors;
}

MonitorInfo MonitorManager::GetPrimaryMonitor() const {
    std::lock_guard<std::mutex> lock(m_mutex);
    for (const auto& m : m_monitors) {
        if (m.isPrimary) return m;
    }
    return m_monitors.empty() ? MonitorInfo() : m_monitors[0];
}

MonitorInfo MonitorManager::GetMonitorByIndex(int index) const {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (index >= 0 && index < static_cast<int>(m_monitors.size())) {
        return m_monitors[index];
    }
    return GetPrimaryMonitor();
}

} // namespace dustfx
