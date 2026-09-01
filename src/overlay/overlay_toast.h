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

#ifndef RGB
#define RGB(r,g,b) ((uint32_t)(((uint8_t)(r)|((uint16_t)((uint8_t)(g))<<8))|(((uint32_t)(uint8_t)(b))<<16)))
#endif

namespace dustfx {

uint32_t HexToRGB(const std::string& hex);

class OverlayToast {
public:
    static OverlayToast& Instance();

    void Initialize();
    void Shutdown();
    void ShowToast(const std::string& title, const std::string& subtitle = "", int durationSeconds = 3);
    void ToggleCrosshair(bool enabled);
    void UpdateCrosshair(const DisplaySettings& settings);
    void ToggleSniperZoom(bool active);
    bool IsSniperZoomActive() const { return m_sniperZoomActive.load(); }
    void UpdateSniperZoom(const DisplaySettings& settings);
    void RefreshOverlayPosition();

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
    std::atomic<bool> m_sniperZoomActive{false};
    DisplaySettings m_crosshairSettings;

    std::thread m_overlayThread;

#ifdef _WIN32
    HWND m_hWnd = NULL;
    HWND m_hMagHost = NULL;
    HWND m_hMagChild = NULL;
    void OverlayThreadProc();
#endif
};

} // namespace dustfx
