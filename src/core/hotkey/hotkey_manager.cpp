#include "core/hotkey/hotkey_manager.h"
#include <iostream>
#include <algorithm>

#ifdef _WIN32
#include <windows.h>

#define HOTKEY_ID_BASE 3000
static HWND g_hHotkeyWnd = NULL;
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
    std::cout << "[HotkeyManager] Global hotkey system active." << std::endl;
    return true;
}

void HotkeyManager::Stop() {
    m_running.store(false);
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
    // No background polling - hotkeys handled via official Windows RegisterHotKey in main window loop
}

} // namespace dustfx
