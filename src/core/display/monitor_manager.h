#pragma once

#include "core/common.h"
#include <vector>
#include <mutex>

namespace dustfx {

class MonitorManager {
public:
    static MonitorManager& Instance();

    void RefreshMonitors();
    std::vector<MonitorInfo> GetMonitors() const;
    MonitorInfo GetPrimaryMonitor() const;
    MonitorInfo GetMonitorByIndex(int index) const;

private:
    MonitorManager();
    ~MonitorManager() = default;

    mutable std::mutex m_mutex;
    std::vector<MonitorInfo> m_monitors;
};

} // namespace dustfx
