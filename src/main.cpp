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

#define ID_TRAY_ICON          1001
#define WM_TRAYICON           (WM_USER + 1)
#define IDM_TRAY_TITLE        2000
#define IDM_TRAY_OPEN         2001
#define IDM_TRAY_MAXGAMMA     2002
#define IDM_TRAY_VIBRANCE     2003
#define IDM_TRAY_CROSSHAIR    2004
#define IDM_TRAY_SNIPERZOOM   2005
#define IDM_TRAY_RESET        2006
#define IDM_TRAY_CHECKUPDATE  2007
#define IDM_TRAY_PROF_CS2     2010
#define IDM_TRAY_PROF_WARZONE 2011
#define IDM_TRAY_PROF_RUST    2012
#define IDM_TRAY_PROF_CYBER   2013
#define IDM_TRAY_EXIT         2099

static NOTIFYICONDATA g_nid = {0};
static HWND g_hHiddenWnd = NULL;

// Open in default system browser
void OpenInDefaultBrowser(const char* url) {
    ShellExecuteA(NULL, "open", url, NULL, NULL, SW_SHOW);
}

void LaunchStudioUI() {
    char localAppData[MAX_PATH] = {0};
    GetEnvironmentVariableA("LOCALAPPDATA", localAppData, MAX_PATH);
    std::string profileArg = "--user-data-dir=\"" + std::string(localAppData) + "\\DustFX\\app_profile\"";
    
    // Standalone desktop app mode without browser bars / tabs
    std::string browserArgs = "--app=http://127.0.0.1:19840/ " + profileArg + 
        " --window-size=1200,820 --window-name=\"DustFX\" --class=\"DustFX\"" +
        " --disable-gpu-vsync --disable-backgrounding-occluded-windows --enable-low-res-tiling " +
        " --enable-gpu-rasterization --enable-zero-copy --disable-software-rasterizer " +
        " --disable-extensions --disable-features=Translate,OptimizationHints,MediaRouter,DevTools,Fullscreen --disable-default-apps";

    // Try Edge in standalone app mode
    HINSTANCE hRes = ShellExecuteA(
        NULL,
        "open",
        "msedge.exe",
        browserArgs.c_str(),
        NULL,
        SW_SHOW
    );

    // Fallback: try chrome in app mode
    if ((intptr_t)hRes <= 32) {
        hRes = ShellExecuteA(
            NULL,
            "open",
            "chrome.exe",
            browserArgs.c_str(),
            NULL,
            SW_SHOW
        );
    }

    // Final fallback: default browser
    if ((intptr_t)hRes <= 32) {
        ShellExecuteA(NULL, "open", "http://127.0.0.1:19840/", NULL, NULL, SW_SHOW);
    }

    // Spawn window icon setter thread to replace Edge icon on taskbar with DustFX purple logo
    std::thread([]() {
        HICON hIconBig = (HICON)LoadImageA(GetModuleHandle(NULL), MAKEINTRESOURCE(1), IMAGE_ICON, 32, 32, LR_DEFAULTCOLOR);
        HICON hIconSmall = (HICON)LoadImageA(GetModuleHandle(NULL), MAKEINTRESOURCE(1), IMAGE_ICON, 16, 16, LR_DEFAULTCOLOR);
        if (!hIconBig) hIconBig = LoadIconA(NULL, IDI_APPLICATION);
        if (!hIconSmall) hIconSmall = hIconBig;

        for (int i = 0; i < 40; ++i) {
            std::this_thread::sleep_for(std::chrono::milliseconds(250));
            HWND hWnd = FindWindowA("Chrome_WidgetWin_1", NULL);
            if (!hWnd) hWnd = FindWindowA(NULL, "DustFX");

            if (hWnd) {
                char title[256] = {0};
                GetWindowTextA(hWnd, title, sizeof(title));
                if (strstr(title, "DustFX") || strstr(title, "127.0.0.1:19840") || strstr(title, "localhost")) {
                    SendMessageA(hWnd, WM_SETICON, ICON_BIG, (LPARAM)hIconBig);
                    SendMessageA(hWnd, WM_SETICON, ICON_SMALL, (LPARAM)hIconSmall);
                    SetWindowTextA(hWnd, "DustFX - GPU Display & Gamma Optimizer");
                    break;
                }
            }
        }
    }).detach();
}

void AddTrayIcon(HWND hWnd) {
    g_nid.cbSize = sizeof(NOTIFYICONDATA);
    g_nid.hWnd = hWnd;
    g_nid.uID = ID_TRAY_ICON;
    g_nid.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP;
    g_nid.uCallbackMessage = WM_TRAYICON;
    
    // Load authentic embedded icon resource
    g_nid.hIcon = (HICON)LoadImageA(GetModuleHandle(NULL), MAKEINTRESOURCE(1), IMAGE_ICON, GetSystemMetrics(SM_CXSMICON), GetSystemMetrics(SM_CYSMICON), LR_DEFAULTCOLOR);
    if (!g_nid.hIcon) {
        g_nid.hIcon = LoadIcon(GetModuleHandle(NULL), MAKEINTRESOURCE(1));
    }
    if (!g_nid.hIcon) {
        g_nid.hIcon = LoadIcon(NULL, IDI_APPLICATION);
    }
    lstrcpyA(g_nid.szTip, "DustFX v1.5.3 — GPU Display & Gamma Optimizer");
    Shell_NotifyIconA(NIM_ADD, &g_nid);
}

void RemoveTrayIcon() {
    Shell_NotifyIconA(NIM_DELETE, &g_nid);
}

LRESULT CALLBACK HiddenWndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam) {
    switch (message) {
        case WM_CREATE:
            AddTrayIcon(hWnd);
            break;

        case WM_TRAYICON: {
            if (lParam == WM_LBUTTONDBLCLK || lParam == WM_LBUTTONUP) {
                LaunchStudioUI();
            } else if (lParam == WM_RBUTTONUP) {
                POINT pt;
                GetCursorPos(&pt);
                HMENU hMenu = CreatePopupMenu();
                HMENU hProfileSubmenu = CreatePopupMenu();

                // Profiles Submenu
                InsertMenuA(hProfileSubmenu, 0, MF_BYPOSITION | MF_STRING, IDM_TRAY_PROF_CS2,     "CS2 / Valorant Focus");
                InsertMenuA(hProfileSubmenu, 1, MF_BYPOSITION | MF_STRING, IDM_TRAY_PROF_WARZONE, "Warzone / Apex Crisp");
                InsertMenuA(hProfileSubmenu, 2, MF_BYPOSITION | MF_STRING, IDM_TRAY_PROF_RUST,    "Rust / Tarkov Night");
                InsertMenuA(hProfileSubmenu, 3, MF_BYPOSITION | MF_STRING, IDM_TRAY_PROF_CYBER,   "Cyberpunk Story Rich");

                // Main Tray Menu
                InsertMenuA(hMenu, 0, MF_BYPOSITION | MF_STRING, IDM_TRAY_OPEN,         "DustFX Studio Paneli Ac");
                InsertMenuA(hMenu, 1, MF_BYPOSITION | MF_SEPARATOR, 0, NULL);
                InsertMenuA(hMenu, 2, MF_BYPOSITION | MF_STRING, IDM_TRAY_MAXGAMMA,     "MAX DCCW Gama (2.5x) Toggle");
                InsertMenuA(hMenu, 3, MF_BYPOSITION | MF_STRING, IDM_TRAY_VIBRANCE,     "Digital Vibrance (%75) Toggle");
                InsertMenuA(hMenu, 4, MF_BYPOSITION | MF_STRING, IDM_TRAY_CROSSHAIR,    "Ozel Nisangah (Crosshair)");
                InsertMenuA(hMenu, 5, MF_BYPOSITION | MF_STRING, IDM_TRAY_SNIPERZOOM,   "Sniper Zoom Lens Toggle");
                InsertMenuA(hMenu, 6, MF_BYPOSITION | MF_SEPARATOR, 0, NULL);
                InsertMenuA(hMenu, 7, MF_BYPOSITION | MF_POPUP, (UINT_PTR)hProfileSubmenu, "Hizli Oyun Profilleri");
                InsertMenuA(hMenu, 8, MF_BYPOSITION | MF_SEPARATOR, 0, NULL);
                InsertMenuA(hMenu, 9, MF_BYPOSITION | MF_STRING, IDM_TRAY_RESET,        "Ayarlari Sifirla (Windows Default)");
                InsertMenuA(hMenu, 10, MF_BYPOSITION | MF_STRING, IDM_TRAY_CHECKUPDATE, "Guncellemeleri Kontrol Et");
                InsertMenuA(hMenu, 11, MF_BYPOSITION | MF_SEPARATOR, 0, NULL);
                InsertMenuA(hMenu, 12, MF_BYPOSITION | MF_STRING, IDM_TRAY_EXIT,        "Cikis (Exit)");

                // Make Dashboard Open default bold
                SetMenuDefaultItem(hMenu, IDM_TRAY_OPEN, FALSE);

                SetForegroundWindow(hWnd);
                int cmd = TrackPopupMenu(hMenu, TPM_RETURNCMD | TPM_NONOTIFY, pt.x, pt.y, 0, hWnd, NULL);
                DestroyMenu(hProfileSubmenu);
                DestroyMenu(hMenu);

                if (cmd == IDM_TRAY_OPEN) {
                    LaunchStudioUI();
                } else if (cmd == IDM_TRAY_MAXGAMMA) {
                    dustfx::DustFxApp::Instance().QuickMaxGamma();
                } else if (cmd == IDM_TRAY_VIBRANCE) {
                    dustfx::DustFxApp::Instance().ToggleVibrance();
                } else if (cmd == IDM_TRAY_CROSSHAIR) {
                    dustfx::DustFxApp::Instance().ToggleCrosshair();
                } else if (cmd == IDM_TRAY_SNIPERZOOM) {
                    dustfx::DustFxApp::Instance().ToggleSniperZoom();
                } else if (cmd == IDM_TRAY_PROF_CS2) {
                    dustfx::DustFxApp::Instance().ApplyProfile("cs2");
                } else if (cmd == IDM_TRAY_PROF_WARZONE) {
                    dustfx::DustFxApp::Instance().ApplyProfile("warzone");
                } else if (cmd == IDM_TRAY_PROF_RUST) {
                    dustfx::DustFxApp::Instance().ApplyProfile("rust");
                } else if (cmd == IDM_TRAY_PROF_CYBER) {
                    dustfx::DustFxApp::Instance().ApplyProfile("cyberpunk");
                } else if (cmd == IDM_TRAY_RESET) {
                    dustfx::DustFxApp::Instance().QuickReset();
                } else if (cmd == IDM_TRAY_CHECKUPDATE) {
                    LaunchStudioUI();
                } else if (cmd == IDM_TRAY_EXIT) {
                    PostQuitMessage(0);
                }
            }
            break;
        }

        case WM_DESTROY:
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
