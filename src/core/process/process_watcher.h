#pragma once

#include "core/common.h"
#include <string>
#include <thread>
#include <atomic>
#include <functional>
#include <unordered_set>

namespace dustfx {

using ProcessEventCallback = std::function<void(const std::string& processName, bool isForeground)>;

class ProcessWatcher {
public:
    static ProcessWatcher& Instance();

    void Start(ProcessEventCallback onForegroundChanged = nullptr,
               ProcessEventCallback onProcessTerminated = nullptr);
    void Stop();

    std::string GetCurrentForegroundProcess() const;
    std::vector<std::string> GetRunningProcesses() const;

private:
    ProcessWatcher();
    ~ProcessWatcher();

    void PollingLoop();
    std::string DetectForegroundProcess();

    std::atomic<bool> m_running{false};
    std::thread m_thread;
    ProcessEventCallback m_onForegroundChanged;
    ProcessEventCallback m_onProcessTerminated;

    std::string m_lastForegroundProcess;
    std::unordered_set<std::string> m_knownProcesses;
};

} // namespace dustfx
