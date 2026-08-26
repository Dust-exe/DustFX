#pragma once

#include "core/common.h"
#include <string>
#include <chrono>
#include <mutex>
#include <atomic>
#include <thread>

#ifdef _WIN32
#include <windows.h>
#endif

namespace dustfx {

class OverlayToast {
public:
    static OverlayToast& Instance();

    void Initialize();
    void Shutdown();
    void ShowToast(const std::string& title, const std::string& subtitle = "", int durationSeconds = 3);
    void ToggleCrosshair(bool enabled);
    void UpdateCrosshair(const DisplaySettings& settings);

#ifdef _WIN32
    void SetCrosshairHwnd(HWND hWnd) { m_hWnd = hWnd; }
    HWND GetCrosshairHwnd() const { return m_hWnd; }
#endif

private:
    OverlayToast();
    ~OverlayToast();

    mutable std::mutex m_mutex;
    std::string m_title;
    std::string m_subtitle;
    std::chrono::steady_clock::time_point m_expiresAt;
    
    std::atomic<bool> m_running{false};
    std::atomic<bool> m_crosshairVisible{false};
    DisplaySettings m_crosshairSettings;

    std::thread m_overlayThread;

#ifdef _WIN32
    HWND m_hWnd = NULL;
    void OverlayThreadProc();
#endif
};

} // namespace dustfx
