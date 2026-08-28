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

    DWORD processId = 0;
    GetWindowThreadProcessId(hwnd, &processId);
    if (processId == 0) return "";

    HANDLE hProcess = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, processId);
    if (hProcess) {
        char exePath[MAX_PATH] = {0};
        DWORD size = MAX_PATH;
        if (QueryFullProcessImageNameA(hProcess, 0, exePath, &size)) {
            CloseHandle(hProcess);
            std::string path(exePath);
            size_t lastSlash = path.find_last_of("\\/");
            if (lastSlash != std::string::npos) {
                return path.substr(lastSlash + 1);
            }
            return path;
        }
        CloseHandle(hProcess);
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
