#pragma once

#include "core/common.h"
#include <string>
#include <chrono>
#include <mutex>
#include <atomic>

namespace dustfx {

class OverlayToast {
public:
    static OverlayToast& Instance();

    void Initialize();
    void ShowToast(const std::string& title, const std::string& subtitle = "", int durationSeconds = 3);
    void ToggleCrosshair(bool enabled);

private:
    OverlayToast();
    ~OverlayToast() = default;

    mutable std::mutex m_mutex;
    std::string m_title;
    std::string m_subtitle;
    std::chrono::steady_clock::time_point m_expiresAt;
    std::atomic<bool> m_crosshairVisible{false};
};

} // namespace dustfx
