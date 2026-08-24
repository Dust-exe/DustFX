#pragma once

#include "core/common.h"
#include <string>
#include <thread>
#include <atomic>
#include <functional>
#include <mutex>
#include <unordered_map>

namespace dustfx {

enum class HotkeyAction {
    MAX_GAMMA_TOGGLE,
    VIBRANCE_TOGGLE,
    QUICK_RESET,
    TOGGLE_OVERLAY,
    TOGGLE_CROSSHAIR,
    SNIPER_ZOOM_HOLD,
    CUSTOM_PROFILE_TRIGGER
};

using HotkeyActionCallback = std::function<void(HotkeyAction action, const std::string& param)>;

class HotkeyManager {
public:
    static HotkeyManager& Instance();

    bool Start();
    void Stop();

    void SetConfig(const HotkeyConfig& config);
    HotkeyConfig GetConfig() const;

    void RegisterCallback(HotkeyActionCallback callback);
    void BindProfileHotkey(const std::string& keyName, const std::string& profileId);

private:
    HotkeyManager();
    ~HotkeyManager();

    void ListenerLoop();
    int ParseVirtualKey(const std::string& keyStr);

    std::atomic<bool> m_running{false};
    std::thread m_thread;
    mutable std::mutex m_mutex;
    HotkeyConfig m_config;
    HotkeyActionCallback m_callback;
    std::unordered_map<std::string, std::string> m_profileHotkeys;
};

} // namespace dustfx
