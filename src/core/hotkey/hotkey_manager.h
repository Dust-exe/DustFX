#pragma once

#include "core/common.h"
#include <string>
#include <thread>
#include <atomic>
#include <functional>
#include <mutex>
#include <unordered_map>
#include <queue>
#include <condition_variable>

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

using HotkeyActionCallback = std::function<void(HotkeyAction, const std::string&, bool)>;

class HotkeyManager {
public:
    static HotkeyManager& Instance();

    bool Start();
    void Stop();

    void SetConfig(const HotkeyConfig& config);
    HotkeyConfig GetConfig() const;

    void RegisterCallback(HotkeyActionCallback callback);
    void BindProfileHotkey(const std::string& keyName, const std::string& profileId);
    void HandleKeyEvent(int vkCode, bool isAlt, bool isCtrl, bool isShift, bool isKeyDown);

private:
    HotkeyManager();
    ~HotkeyManager();

    void HookThreadProc();
    void WorkerThreadProc();
    int ParseVirtualKey(const std::string& keyStr);
    std::string BuildKeyComboString(int vkCode, bool isAlt, bool isCtrl, bool isShift);

    struct KeyEvent {
        int vkCode;
        bool isAlt;
        bool isCtrl;
        bool isShift;
        bool isKeyDown;
    };

    std::atomic<bool> m_running{false};
    std::thread m_thread;
    std::thread m_workerThread;
    
    mutable std::mutex m_mutex;
    std::condition_variable m_cv;
    std::queue<KeyEvent> m_eventQueue;
    
    HotkeyConfig m_config;
    HotkeyActionCallback m_callback;
    std::unordered_map<std::string, std::string> m_profileHotkeys;
};

} // namespace dustfx
