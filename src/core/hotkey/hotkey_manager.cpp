#include "core/hotkey/hotkey_manager.h"
#include <iostream>
#include <algorithm>

#ifdef _WIN32
#include <windows.h>

static HHOOK g_hKeyboardHook = NULL;
static DWORD g_hookThreadId = 0;

static LRESULT CALLBACK LowLevelKeyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode == HC_ACTION && (wParam == WM_KEYDOWN || wParam == WM_SYSKEYDOWN)) {
        KBDLLHOOKSTRUCT* pKey = reinterpret_cast<KBDLLHOOKSTRUCT*>(lParam);
        if (pKey) {
            bool isAlt = (GetAsyncKeyState(VK_MENU) & 0x8000) != 0;
            bool isCtrl = (GetAsyncKeyState(VK_CONTROL) & 0x8000) != 0;
            bool isShift = (GetAsyncKeyState(VK_SHIFT) & 0x8000) != 0;

            // Don't trigger on modifier key presses alone
            if (pKey->vkCode != VK_MENU && pKey->vkCode != VK_LMENU && pKey->vkCode != VK_RMENU &&
                pKey->vkCode != VK_CONTROL && pKey->vkCode != VK_LCONTROL && pKey->vkCode != VK_RCONTROL &&
                pKey->vkCode != VK_SHIFT && pKey->vkCode != VK_LSHIFT && pKey->vkCode != VK_RSHIFT) {
                
                dustfx::HotkeyManager::Instance().HandleKeyEvent(pKey->vkCode, isAlt, isCtrl, isShift);
            }
        }
    }
    // ALWAYS call CallNextHookEx — PASSTHROUGH guarantees keys are NEVER locked!
    return CallNextHookEx(g_hKeyboardHook, nCode, wParam, lParam);
}
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
#ifdef _WIN32
    m_thread = std::thread(&HotkeyManager::HookThreadProc, this);
#endif
    std::cout << "[HotkeyManager] Non-blocking global keyboard hook active (0% key lock)." << std::endl;
    return true;
}

void HotkeyManager::Stop() {
    if (m_running.load()) {
        m_running.store(false);
#ifdef _WIN32
        if (g_hookThreadId != 0) {
            PostThreadMessageA(g_hookThreadId, WM_QUIT, 0, 0);
        }
        if (m_thread.joinable()) {
            m_thread.join();
        }
        if (g_hKeyboardHook) {
            UnhookWindowsHookEx(g_hKeyboardHook);
            g_hKeyboardHook = NULL;
        }
#endif
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
    std::string cleanKey = keyName;
    std::transform(cleanKey.begin(), cleanKey.end(), cleanKey.begin(), ::toupper);
    m_profileHotkeys[cleanKey] = profileId;
    std::cout << "[HotkeyManager] Bound Profile '" << profileId << "' to Hotkey [" << cleanKey << "]" << std::endl;
}

std::string HotkeyManager::BuildKeyComboString(int vkCode, bool isAlt, bool isCtrl, bool isShift) {
    std::string combo = "";
    if (isCtrl) combo += "CTRL+";
    if (isAlt) combo += "ALT+";
    if (isShift) combo += "SHIFT+";

    std::string keyPart = "";
    if (vkCode >= VK_F1 && vkCode <= VK_F24) {
        keyPart = "F" + std::to_string(vkCode - VK_F1 + 1);
    } else if (vkCode >= 'A' && vkCode <= 'Z') {
        keyPart = std::string(1, static_cast<char>(vkCode));
    } else if (vkCode >= '0' && vkCode <= '9') {
        keyPart = std::string(1, static_cast<char>(vkCode));
    } else if (vkCode == VK_SPACE) keyPart = "SPACE";
    else if (vkCode == VK_INSERT) keyPart = "INSERT";
    else if (vkCode == VK_DELETE) keyPart = "DELETE";
    else if (vkCode == VK_HOME) keyPart = "HOME";
    else if (vkCode == VK_END) keyPart = "END";
    else if (vkCode == VK_OEM_3) keyPart = "~";

    if (keyPart.empty()) return "";
    return combo + keyPart;
}

void HotkeyManager::HandleKeyEvent(int vkCode, bool isAlt, bool isCtrl, bool isShift) {
    std::string pressedCombo = BuildKeyComboString(vkCode, isAlt, isCtrl, isShift);
    if (pressedCombo.empty()) return;

    HotkeyActionCallback cb;
    HotkeyConfig cfg;
    std::unordered_map<std::string, std::string> profHotkeys;
    {
        std::lock_guard<std::mutex> lock(m_mutex);
        cb = m_callback;
        cfg = m_config;
        profHotkeys = m_profileHotkeys;
    }

    if (!cb) return;

    auto ToUpperStr = [](std::string s) {
        std::transform(s.begin(), s.end(), s.begin(), ::toupper);
        return s;
    };

    std::string upperCombo = ToUpperStr(pressedCombo);

    if (upperCombo == ToUpperStr(cfg.maxGammaKey)) {
        cb(HotkeyAction::MAX_GAMMA_TOGGLE, "");
    } else if (upperCombo == ToUpperStr(cfg.vibranceKey)) {
        cb(HotkeyAction::VIBRANCE_TOGGLE, "");
    } else if (upperCombo == ToUpperStr(cfg.quickResetKey)) {
        cb(HotkeyAction::QUICK_RESET, "");
    } else if (upperCombo == ToUpperStr(cfg.toggleCrosshairKey)) {
        cb(HotkeyAction::TOGGLE_CROSSHAIR, "");
    } else if (upperCombo == ToUpperStr(cfg.toggleOverlayKey)) {
        cb(HotkeyAction::TOGGLE_OVERLAY, "");
    } else {
        auto it = profHotkeys.find(upperCombo);
        if (it != profHotkeys.end()) {
            cb(HotkeyAction::CUSTOM_PROFILE_TRIGGER, it->second);
        }
    }
}

void HotkeyManager::HookThreadProc() {
#ifdef _WIN32
    g_hookThreadId = GetCurrentThreadId();
    g_hKeyboardHook = SetWindowsHookExA(WH_KEYBOARD_LL, LowLevelKeyboardProc, GetModuleHandle(NULL), 0);

    MSG msg;
    while (m_running.load() && GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    if (g_hKeyboardHook) {
        UnhookWindowsHookEx(g_hKeyboardHook);
        g_hKeyboardHook = NULL;
    }
#endif
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

} // namespace dustfx
