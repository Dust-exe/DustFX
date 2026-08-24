#include "core/process/process_watcher.h"
#include <iostream>
#include <chrono>

#ifdef _WIN32
#include <windows.h>
#include <psapi.h>
#include <tlhelp32.h>
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

    std::cout << "[ProcessWatcher] Started foreground and active game detector loop." << std::endl;
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
    if (!hwnd) return "";

    DWORD pid = 0;
    GetWindowThreadProcessId(hwnd, &pid);
    if (pid == 0) return "";

    HANDLE hProcess = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pid);
    if (!hProcess) return "";

    char buffer[MAX_PATH];
    DWORD size = MAX_PATH;
    if (QueryFullProcessImageNameA(hProcess, 0, buffer, &size)) {
        CloseHandle(hProcess);
        std::string fullPath(buffer);
        size_t lastSlash = fullPath.find_last_of("\\/");
        if (lastSlash != std::string::npos) {
            return fullPath.substr(lastSlash + 1);
        }
        return fullPath;
    }
    CloseHandle(hProcess);
#endif
    return "";
}

std::vector<std::string> ProcessWatcher::GetRunningProcesses() const {
    std::vector<std::string> list;
#ifdef _WIN32
    HANDLE hSnap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnap != INVALID_HANDLE_VALUE) {
        PROCESSENTRY32 pe;
        pe.dwSize = sizeof(pe);
        if (Process32First(hSnap, &pe)) {
            do {
                list.push_back(pe.szExeFile);
            } while (Process32Next(hSnap, &pe));
        }
        CloseHandle(hSnap);
    }
#endif
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

        std::this_thread::sleep_for(std::chrono::milliseconds(500));
    }
}

} // namespace dustfx
