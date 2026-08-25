#include "core/process/process_watcher.h"
#include <iostream>
#include <chrono>

#ifdef _WIN32
#include <windows.h>
#endif

namespace dustfx {

ProcessWatcher& ProcessWatcher::Instance() {
    static ProcessWatcher instance;
    return instance;
}

ProcessWatcher::ProcessWatcher() = default;

ProcessWatcher::~ProcessWatcher() {
    Stop();
}

void ProcessWatcher::Start(ProcessEventCallback onForegroundChanged, ProcessEventCallback onProcessTerminated) {
    if (m_running.load()) return;

    m_onForegroundChanged = std::move(onForegroundChanged);
    m_onProcessTerminated = std::move(onProcessTerminated);
    m_running.store(true);
    m_thread = std::thread(&ProcessWatcher::PollingLoop, this);

    std::cout << "[ProcessWatcher] Foreground game detector active." << std::endl;
}

void ProcessWatcher::Stop() {
    if (m_running.load()) {
        m_running.store(false);
        if (m_thread.joinable()) {
            m_thread.join();
        }
    }
}

std::string ProcessWatcher::GetCurrentForegroundProcess() const {
    return m_lastForegroundProcess;
}

std::string ProcessWatcher::DetectForegroundProcess() {
#ifdef _WIN32
    HWND hwnd = GetForegroundWindow();
    if (!hwnd || !IsWindow(hwnd)) return "";

    char title[256] = {0};
    if (GetWindowTextA(hwnd, title, sizeof(title)) > 0) {
        return std::string(title);
    }
#endif
    return "";
}

std::vector<std::string> ProcessWatcher::GetRunningProcesses() const {
    std::vector<std::string> list;
    return list;
}

void ProcessWatcher::PollingLoop() {
    while (m_running.load()) {
        std::string currentForeground = DetectForegroundProcess();

        if (!currentForeground.empty() && currentForeground != m_lastForegroundProcess) {
            m_lastForegroundProcess = currentForeground;
            if (m_onForegroundChanged) {
                m_onForegroundChanged(currentForeground, true);
            }
        }

        // Relaxed poll (1 second interval)
        for (int i = 0; i < 10 && m_running.load(); ++i) {
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
    }
}

} // namespace dustfx
