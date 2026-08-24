#include "core/hotkey/hotkey_manager.h"
#include <iostream>
#include <chrono>
#include <algorithm>

#ifdef _WIN32
#include <windows.h>
#endif

namespace dustfx {

HotkeyManager& HotkeyManager::Instance() {
    static HotkeyManager instance;
    return instance;
}

HotkeyManager::HotkeyManager() = default;

HotkeyManager::~HotkeyManager() {
    Stop();
}

bool HotkeyManager::Start() {
    if (m_running.load()) return true;
    m_running.store(true);
    m_thread = std::thread(&HotkeyManager::ListenerLoop, this);
    std::cout << "[HotkeyManager] Global hotkey listener active." << std::endl;
    return true;
}

void HotkeyManager::Stop() {
    if (m_running.load()) {
        m_running.store(false);
        if (m_thread.joinable()) {
            m_thread.join();
        }
    }
}

void HotkeyManager::SetConfig(const HotkeyConfig& config) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_config = config;
}

HotkeyConfig HotkeyManager::GetConfig() const {
    std::lock_guard<std::mutex> lock(m_mutex);
    return m_config;
}

void HotkeyManager::RegisterCallback(HotkeyActionCallback callback) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_callback = std::move(callback);
}

void HotkeyManager::BindProfileHotkey(const std::string& keyName, const std::string& profileId) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_profileHotkeys[keyName] = profileId;
}

int HotkeyManager::ParseVirtualKey(const std::string& keyStr) {
#ifdef _WIN32
    std::string k = keyStr;
    std::transform(k.begin(), k.end(), k.begin(), ::toupper);

    if (k == "F1") return VK_F1;
    if (k == "F2") return VK_F2;
    if (k == "F3") return VK_F3;
    if (k == "F4") return VK_F4;
    if (k == "F5") return VK_F5;
    if (k == "F6") return VK_F6;
    if (k == "F7") return VK_F7;
    if (k == "F8") return VK_F8;
    if (k == "F9") return VK_F9;
    if (k == "F10") return VK_F10;
    if (k == "F11") return VK_F11;
    if (k == "F12") return VK_F12;
    if (k == "SPACE") return VK_SPACE;
    if (k == "INSERT") return VK_INSERT;
    if (k == "DELETE") return VK_DELETE;
    if (k == "HOME") return VK_HOME;
    if (k == "END") return VK_END;
    if (k.length() == 1) {
        char c = k[0];
        if (c >= 'A' && c <= 'Z') return c;
        if (c >= '0' && c <= '9') return c;
    }
#endif
    (void)keyStr;
    return 0;
}

void HotkeyManager::ListenerLoop() {
#ifdef _WIN32
    bool prevF11 = false;
    bool prevF12 = false;
    bool prevF10 = false;
    bool prevAltX = false;
    bool prevAltZ = false;

    while (m_running.load()) {
        HotkeyConfig cfg;
        {
            std::lock_guard<std::mutex> lock(m_mutex);
            cfg = m_config;
        }

        int vkF11 = ParseVirtualKey(cfg.maxGammaKey);
        int vkF12 = ParseVirtualKey(cfg.vibranceKey);
        int vkF10 = ParseVirtualKey(cfg.quickResetKey);

        bool altPressed = (GetAsyncKeyState(VK_MENU) & 0x8000) != 0;
        bool xPressed = (GetAsyncKeyState('X') & 0x8000) != 0;
        bool zPressed = (GetAsyncKeyState('Z') & 0x8000) != 0;

        // F11 (Max Gamma)
        if (vkF11 > 0) {
            bool f11Pressed = (GetAsyncKeyState(vkF11) & 0x8000) != 0;
            if (f11Pressed && !prevF11) {
                std::lock_guard<std::mutex> lock(m_mutex);
                if (m_callback) m_callback(HotkeyAction::MAX_GAMMA_TOGGLE, "");
            }
            prevF11 = f11Pressed;
        }

        // F12 (Vibrance Toggle)
        if (vkF12 > 0) {
            bool f12Pressed = (GetAsyncKeyState(vkF12) & 0x8000) != 0;
            if (f12Pressed && !prevF12) {
                std::lock_guard<std::mutex> lock(m_mutex);
                if (m_callback) m_callback(HotkeyAction::VIBRANCE_TOGGLE, "");
            }
            prevF12 = f12Pressed;
        }

        // F10 (Quick Reset)
        if (vkF10 > 0) {
            bool f10Pressed = (GetAsyncKeyState(vkF10) & 0x8000) != 0;
            if (f10Pressed && !prevF10) {
                std::lock_guard<std::mutex> lock(m_mutex);
                if (m_callback) m_callback(HotkeyAction::QUICK_RESET, "");
            }
            prevF10 = f10Pressed;
        }

        // Alt+X (Toggle Overlay)
        bool altX = altPressed && xPressed;
        if (altX && !prevAltX) {
            std::lock_guard<std::mutex> lock(m_mutex);
            if (m_callback) m_callback(HotkeyAction::TOGGLE_OVERLAY, "");
        }
        prevAltX = altX;

        // Alt+Z (Toggle Crosshair)
        bool altZ = altPressed && zPressed;
        if (altZ && !prevAltZ) {
            std::lock_guard<std::mutex> lock(m_mutex);
            if (m_callback) m_callback(HotkeyAction::TOGGLE_CROSSHAIR, "");
        }
        prevAltZ = altZ;

        std::this_thread::sleep_for(std::chrono::milliseconds(20));
    }
#else
    while (m_running.load()) {
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
#endif
}

} // namespace dustfx
