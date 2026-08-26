#include "core/app/dustfx_app.h"
#include "overlay/overlay_toast.h"
#include "server/http_server.h"
#include <iostream>
#include <csignal>
#include <thread>
#include <chrono>
#include <atomic>

#ifdef _WIN32
#include <windows.h>
#include <shellapi.h>
#include <objbase.h>

#define ID_TRAY_ICON       1001
#define WM_TRAYICON        (WM_USER + 1)
#define IDM_TRAY_OPEN      2001
#define IDM_TRAY_MAXGAMMA  2002
#define IDM_TRAY_RESET     2003
#define IDM_TRAY_EXIT      2004

static NOTIFYICONDATA g_nid = {0};
static HWND g_hHiddenWnd = NULL;

// Open in default system browser (NOT Edge forced)
void OpenInDefaultBrowser(const char* url) {
    ShellExecuteA(NULL, "open", url, NULL, NULL, SW_SHOW);
}

void LaunchStudioUI() {
    // Try Edge in --app mode with DevTools and fullscreen disabled
    HINSTANCE hRes = ShellExecuteA(
        NULL,
        "open",
        "msedge.exe",
        "--app=http://127.0.0.1:19840/ --window-size=1150,780 --window-controls-overlay --disable-extensions --disable-features=DevTools,Fullscreen --disable-default-apps",
        NULL,
        SW_SHOW
    );

    // Fallback: try chrome in app mode
    if ((intptr_t)hRes <= 32) {
        hRes = ShellExecuteA(
            NULL,
            "open",
            "chrome.exe",
            "--app=http://127.0.0.1:19840/ --window-size=1150,780 --window-controls-overlay --disable-extensions --disable-features=DevTools,Fullscreen --disable-default-apps",
            NULL,
            SW_SHOW
        );
    }

    // Final fallback: default browser
    if ((intptr_t)hRes <= 32) {
        ShellExecuteA(NULL, "open", "http://127.0.0.1:19840/", NULL, NULL, SW_SHOW);
    }
}

void AddTrayIcon(HWND hWnd) {
    g_nid.cbSize = sizeof(NOTIFYICONDATA);
    g_nid.hWnd = hWnd;
    g_nid.uID = ID_TRAY_ICON;
    g_nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP;
    g_nid.uCallbackMessage = WM_TRAYICON;
    g_nid.hIcon = LoadIcon(GetModuleHandle(NULL), MAKEINTRESOURCE(1));
    if (!g_nid.hIcon) {
        g_nid.hIcon = LoadIcon(NULL, IDI_APPLICATION);
    }
    lstrcpyA(g_nid.szTip, "DustFX - GPU Display & Gamma Optimizer");
    Shell_NotifyIconA(NIM_ADD, &g_nid);
}

void RemoveTrayIcon() {
    Shell_NotifyIconA(NIM_DELETE, &g_nid);
}

#define HK_ID_F11   3001
#define HK_ID_F10   3002
#define HK_ID_ALT_Z 3003
#define HK_ID_ALT_X 3004

LRESULT CALLBACK HiddenWndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam) {
    switch (message) {
        case WM_CREATE:
            AddTrayIcon(hWnd);
            RegisterHotKey(hWnd, HK_ID_F11, 0, VK_F11);
            RegisterHotKey(hWnd, HK_ID_F10, 0, VK_F10);
            // Alt+Z crosshair hotkey suspended (overlay bakımda)
            RegisterHotKey(hWnd, HK_ID_ALT_X, MOD_ALT, 'X');
            break;

        case WM_HOTKEY: {
            int id = (int)wParam;
            if (id == HK_ID_F11) {
                dustfx::DustFxApp::Instance().QuickMaxGamma();
            } else if (id == HK_ID_F10) {
                dustfx::DustFxApp::Instance().QuickReset();
            } else if (id == HK_ID_ALT_Z) { // suspended
                dustfx::DustFxApp::Instance().ToggleCrosshair();
            }
            break;
        }

        case WM_TRAYICON: {
            if (lParam == WM_RBUTTONUP || lParam == WM_LBUTTONUP) {
                POINT pt;
                GetCursorPos(&pt);
                HMENU hMenu = CreatePopupMenu();

                // Use ASCII-safe strings to avoid encoding issues
                InsertMenuA(hMenu, 0, MF_BYPOSITION | MF_STRING, IDM_TRAY_OPEN,      "DustFX Paneli Ac");
                InsertMenuA(hMenu, 1, MF_BYPOSITION | MF_STRING, IDM_TRAY_MAXGAMMA,  "MAX DCCW Gama Toggl (F11)");
                InsertMenuA(hMenu, 2, MF_BYPOSITION | MF_STRING, IDM_TRAY_RESET,     "Ayarlari Sifirla (F10)");
                InsertMenuA(hMenu, 3, MF_BYPOSITION | MF_SEPARATOR, 0, NULL);
                InsertMenuA(hMenu, 4, MF_BYPOSITION | MF_STRING, IDM_TRAY_EXIT,      "Cikis (Exit)");

                SetForegroundWindow(hWnd);
                int cmd = TrackPopupMenu(hMenu, TPM_RETURNCMD | TPM_NONOTIFY, pt.x, pt.y, 0, hWnd, NULL);
                DestroyMenu(hMenu);

                if (cmd == IDM_TRAY_OPEN) {
                    LaunchStudioUI();
                } else if (cmd == IDM_TRAY_MAXGAMMA) {
                    dustfx::DustFxApp::Instance().QuickMaxGamma();
                } else if (cmd == IDM_TRAY_RESET) {
                    dustfx::DustFxApp::Instance().QuickReset();
                } else if (cmd == IDM_TRAY_EXIT) {
                    PostQuitMessage(0);
                }
            }
            break;
        }

        case WM_DESTROY:
            UnregisterHotKey(hWnd, HK_ID_F11);
            UnregisterHotKey(hWnd, HK_ID_F10);
            // Alt+Z suspended
            UnregisterHotKey(hWnd, HK_ID_ALT_X);
            RemoveTrayIcon();
            PostQuitMessage(0);
            break;

        default:
            return DefWindowProc(hWnd, message, wParam, lParam);
    }
    return 0;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // Single instance mutex - if already running, open the UI
    HANDLE hMutex = CreateMutexA(NULL, TRUE, "DustFX_SingleInstance_Mutex");
    if (GetLastError() == ERROR_ALREADY_EXISTS) {
        // Bring existing window to front + open UI
        LaunchStudioUI();
        return 0;
    }

    try {
        CoInitializeEx(NULL, COINIT_MULTITHREADED);
    } catch (...) {}

    auto& app = dustfx::DustFxApp::Instance();
    app.Initialize();
    app.Start();

    WNDCLASSEXA wcex = {0};
    wcex.cbSize = sizeof(WNDCLASSEXA);
    wcex.lpfnWndProc = HiddenWndProc;
    wcex.hInstance = hInstance;
    wcex.lpszClassName = "DustFXHiddenTrayClass";
    RegisterClassExA(&wcex);

    g_hHiddenWnd = CreateWindowExA(
        0,
        "DustFXHiddenTrayClass",
        "DustFXTrayHost",
        0, 0, 0, 0, 0,
        NULL, NULL, hInstance, NULL
    );

    dustfx::OverlayToast::Instance().Initialize();

    LaunchStudioUI();

    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    app.Stop();
    if (hMutex) CloseHandle(hMutex);
    return (int)msg.wParam;
}

#else

// Linux server fallback
static std::atomic<bool> g_keepRunning{true};

void SignalHandler(int signum) {
    std::cout << "\n[DustFX] Stopping..." << std::endl;
    g_keepRunning.store(false);
}

int main(int argc, char* argv[]) {
    signal(SIGINT, SignalHandler);
    signal(SIGTERM, SignalHandler);

    std::cout << "DustFX Server active on http://127.0.0.1:19840" << std::endl;

    auto& app = dustfx::DustFxApp::Instance();
    app.Initialize();
    app.Start();

    while (g_keepRunning.load()) {
        std::this_thread::sleep_for(std::chrono::milliseconds(200));
    }

    app.Stop();
    return 0;
}

#endif
