#include "overlay/overlay_toast.h"
#include <iostream>
#include <thread>

#ifdef _WIN32
#include <windows.h>
#endif

namespace dustfx {

OverlayToast& OverlayToast::Instance() {
    static OverlayToast instance;
    return instance;
}

OverlayToast::OverlayToast() = default;

void OverlayToast::Initialize() {
    std::cout << "[OverlayToast] In-game OSD & Crosshair system initialized." << std::endl;
}

void OverlayToast::ShowToast(const std::string& title, const std::string& subtitle, int durationSeconds) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_title = title;
    m_subtitle = subtitle;
    m_expiresAt = std::chrono::steady_clock::now() + std::chrono::seconds(durationSeconds);

    std::cout << "[DustFX OSD] 🔔 " << title << (subtitle.empty() ? "" : " — " + subtitle) << std::endl;

#ifdef _WIN32
    // Windows Beep feedback
    MessageBeep(MB_ICONASTERISK);
#endif
}

void OverlayToast::ToggleCrosshair(bool enabled) {
    m_crosshairVisible.store(enabled);
    std::cout << "[OverlayToast] Crosshair overlay " << (enabled ? "ENABLED" : "DISABLED") << std::endl;
}

} // namespace dustfx
