#pragma once

#include "core/common.h"
#include "core/hotkey/hotkey_manager.h"
#include <atomic>
#include <memory>

namespace dustfx {

class DustFxApp {
public:
    static DustFxApp& Instance();

    bool Initialize();
    void Start();
    void Stop();

    void ApplyProfile(const std::string& profileId);
    void QuickMaxGamma();
    void QuickReset();
    void ToggleCrosshair();

private:
    DustFxApp();
    ~DustFxApp();

    void HandleHotkey(HotkeyAction action, const std::string& param, bool isKeyDown);
    void HandleProcessEvent(const std::string& processName, bool isForeground);
    void OnUpdateDetected(bool available, const ReleaseInfo& info);

    std::atomic<bool> m_running{false};
    bool m_maxGammaActive = false;
    bool m_vibranceActive = false;
    bool m_crosshairActive = false;
};

} // namespace dustfx
