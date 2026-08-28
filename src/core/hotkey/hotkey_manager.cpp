#include "core/hotkey/hotkey_manager.h"
#include <iostream>
#include <algorithm>

#ifdef _WIN32
#include <windows.h>

static HHOOK g_hKeyboardHook = NULL;
static HHOOK g_hMouseHook = NULL;
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

static LRESULT CALLBACK LowLevelMouseProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode == HC_ACTION) {
        MSLLHOOKSTRUCT* pMouse = reinterpret_cast<MSLLHOOKSTRUCT*>(lParam);
        if (pMouse) {
            bool isAlt = (GetAsyncKeyState(VK_MENU) & 0x8000) != 0;
            bool isCtrl = (GetAsyncKeyState(VK_CONTROL) & 0x8000) != 0;
            bool isShift = (GetAsyncKeyState(VK_SHIFT) & 0x8000) != 0;

            int vkCode = 0;
            if (wParam == WM_MBUTTONDOWN || wParam == WM_NCMBUTTONDOWN) {
                vkCode = VK_MBUTTON; // MOUSE3
            } else if (wParam == WM_XBUTTONDOWN || wParam == WM_NCXBUTTONDOWN) {
                DWORD button = HIWORD(pMouse->mouseData);
                if (button == XBUTTON1) vkCode = VK_XBUTTON1; // MOUSE4
                else if (button == XBUTTON2) vkCode = VK_XBUTTON2; // MOUSE5
            }

            if (vkCode != 0) {
                dustfx::HotkeyManager::Instance().HandleKeyEvent(vkCode, isAlt, isCtrl, isShift);
            }
        }
    }
    return CallNextHookEx(g_hMouseHook, nCode, wParam, lParam);
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
    std::cout << "[HotkeyManager] Non-blocking global keyboard & mouse hook active (0% input lag)." << std::endl;
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
        if (g_hMouseHook) {
            UnhookWindowsHookEx(g_hMouseHook);
            g_hMouseHook = NULL;
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
#ifdef _WIN32
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
    } else if (vkCode == VK_MBUTTON) keyPart = "MOUSE3";
    else if (vkCode == VK_XBUTTON1) keyPart = "MOUSE4";
    else if (vkCode == VK_XBUTTON2) keyPart = "MOUSE5";
    else if (vkCode == VK_LBUTTON) keyPart = "MOUSE1";
    else if (vkCode == VK_RBUTTON) keyPart = "MOUSE2";
    else if (vkCode == VK_SPACE) keyPart = "SPACE";
    else if (vkCode == VK_INSERT) keyPart = "INSERT";
    else if (vkCode == VK_DELETE) keyPart = "DELETE";
    else if (vkCode == VK_HOME) keyPart = "HOME";
    else if (vkCode == VK_END) keyPart = "END";
    else if (vkCode == VK_PRIOR) keyPart = "PAGEUP";
    else if (vkCode == VK_NEXT) keyPart = "PAGEDOWN";
    else if (vkCode == VK_UP) keyPart = "UP";
    else if (vkCode == VK_DOWN) keyPart = "DOWN";
    else if (vkCode == VK_LEFT) keyPart = "LEFT";
    else if (vkCode == VK_RIGHT) keyPart = "RIGHT";
    else if (vkCode == VK_TAB) keyPart = "TAB";
    else if (vkCode == VK_CAPITAL) keyPart = "CAPSLOCK";
    else if (vkCode == VK_RETURN) keyPart = "ENTER";
    else if (vkCode == VK_ESCAPE) keyPart = "ESC";
    else if (vkCode == VK_BACK) keyPart = "BACKSPACE";
    else if (vkCode >= VK_NUMPAD0 && vkCode <= VK_NUMPAD9) {
        keyPart = "NUMPAD" + std::to_string(vkCode - VK_NUMPAD0);
    } else if (vkCode == VK_MULTIPLY) keyPart = "NUMPAD*";
    else if (vkCode == VK_ADD) keyPart = "NUMPAD+";
    else if (vkCode == VK_SUBTRACT) keyPart = "NUMPAD-";
    else if (vkCode == VK_DECIMAL) keyPart = "NUMPAD.";
    else if (vkCode == VK_DIVIDE) keyPart = "NUMPAD/";
    else if (vkCode == VK_OEM_3) keyPart = "~";
    else if (vkCode == VK_OEM_1) keyPart = ";";
    else if (vkCode == VK_OEM_PLUS) keyPart = "+";
    else if (vkCode == VK_OEM_COMMA) keyPart = ",";
    else if (vkCode == VK_OEM_MINUS) keyPart = "-";
    else if (vkCode == VK_OEM_PERIOD) keyPart = ".";
    else if (vkCode == VK_OEM_2) keyPart = "/";
    else if (vkCode == VK_OEM_4) keyPart = "[";
    else if (vkCode == VK_OEM_5) keyPart = "\\";
    else if (vkCode == VK_OEM_6) keyPart = "]";
    else if (vkCode == VK_OEM_7) keyPart = "'";

    if (keyPart.empty()) return "";
    return combo + keyPart;
#else
    (void)vkCode; (void)isAlt; (void)isCtrl; (void)isShift;
    return "";
#endif
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
    } else if (upperCombo == ToUpperStr(cfg.sniperZoomKey)) {
        cb(HotkeyAction::SNIPER_ZOOM_HOLD, "");
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
    g_hMouseHook    = SetWindowsHookExA(WH_MOUSE_LL, LowLevelMouseProc, GetModuleHandle(NULL), 0);

    MSG msg;
    while (m_running.load() && GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    if (g_hKeyboardHook) {
        UnhookWindowsHookEx(g_hKeyboardHook);
        g_hKeyboardHook = NULL;
    }
    if (g_hMouseHook) {
        UnhookWindowsHookEx(g_hMouseHook);
        g_hMouseHook = NULL;
    }
#endif
}

int HotkeyManager::ParseVirtualKey(const std::string& keyStr) {
#ifdef _WIN32
    std::string k = keyStr;
    std::transform(k.begin(), k.end(), k.begin(), ::toupper);

    if (k.rfind("CTRL+", 0) == 0) k = k.substr(5);
    if (k.rfind("ALT+", 0) == 0) k = k.substr(4);
    if (k.rfind("SHIFT+", 0) == 0) k = k.substr(6);

    if (k >= "F1" && k <= "F24") {
        int num = std::stoi(k.substr(1));
        return VK_F1 + (num - 1);
    }
    if (k == "MOUSE3" || k == "MBUTTON") return VK_MBUTTON;
    if (k == "MOUSE4" || k == "XBUTTON1") return VK_XBUTTON1;
    if (k == "MOUSE5" || k == "XBUTTON2") return VK_XBUTTON2;
    if (k == "SPACE") return VK_SPACE;
    if (k == "INSERT") return VK_INSERT;
    if (k == "DELETE") return VK_DELETE;
    if (k == "HOME") return VK_HOME;
    if (k == "END") return VK_END;
    if (k == "PAGEUP" || k == "PGUP") return VK_PRIOR;
    if (k == "PAGEDOWN" || k == "PGDN") return VK_NEXT;
    if (k == "UP") return VK_UP;
    if (k == "DOWN") return VK_DOWN;
    if (k == "LEFT") return VK_LEFT;
    if (k == "RIGHT") return VK_RIGHT;
    if (k == "TAB") return VK_TAB;
    if (k == "CAPSLOCK") return VK_CAPITAL;
    if (k == "ENTER" || k == "RETURN") return VK_RETURN;
    if (k == "ESC" || k == "ESCAPE") return VK_ESCAPE;
    if (k == "BACKSPACE" || k == "BACK") return VK_BACK;
    if (k == "~" || k == "TILDE") return VK_OEM_3;

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
