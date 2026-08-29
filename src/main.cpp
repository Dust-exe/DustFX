#include "core/app/dustfx_app.h"
#include "overlay/overlay_toast.h"
#include "server/http_server.h"
#include <iostream>
#include <csignal>
#include <thread>
#include <chrono>
#include <atomic>
#include <memory>

#ifdef _WIN32
#include <windows.h>
#include <shellapi.h>
#include <objbase.h>

#define WEBVIEW_EDGE
#include "webview/webview.h"

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
static HWND g_hWebviewWnd = NULL;
static WNDPROC g_pOriginalWebviewWndProc = NULL;
static std::unique_ptr<webview::webview> g_pWebView = nullptr;
static std::atomic<bool> g_isExiting{false};

void ShowStudioUI() {
    if (g_hWebviewWnd && IsWindow(g_hWebviewWnd)) {
        ShowWindow(g_hWebviewWnd, SW_SHOW);
        ShowWindow(g_hWebviewWnd, SW_RESTORE);
        SetForegroundWindow(g_hWebviewWnd);
    } else {
        ShellExecuteA(NULL, "open", "http://127.0.0.1:19840/", NULL, NULL, SW_SHOW);
    }
}

// Subclassed window procedure for WebView2 window to minimize/hide to tray on close
LRESULT CALLBACK WebviewSubclassWndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    if (msg == WM_CLOSE && !g_isExiting.load()) {
        ShowWindow(hWnd, SW_HIDE);
        return 0;
    }
    return CallWindowProc(g_pOriginalWebviewWndProc, hWnd, msg, wParam, lParam);
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
    lstrcpyA(g_nid.szTip, "DustFX v1.7.0 — GPU Display & Gamma Optimizer");
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
                ShowStudioUI();
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
                    ShowStudioUI();
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
                    ShowStudioUI();
                } else if (cmd == IDM_TRAY_EXIT) {
                    g_isExiting.store(true);
                    if (g_pWebView) {
                        g_pWebView->terminate();
                    }
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
    // Single instance mutex - if already running, bring existing window to front
    HANDLE hMutex = CreateMutexA(NULL, TRUE, "DustFX_SingleInstance_Mutex");
    if (GetLastError() == ERROR_ALREADY_EXISTS) {
        HWND hWndExisting = FindWindowA(NULL, "DustFX — GPU Display & Gamma Optimizer");
        if (!hWndExisting) hWndExisting = FindWindowA(NULL, "DustFX");
        if (hWndExisting) {
            ShowWindow(hWndExisting, SW_SHOW);
            ShowWindow(hWndExisting, SW_RESTORE);
            SetForegroundWindow(hWndExisting);
        } else {
            ShellExecuteA(NULL, "open", "http://127.0.0.1:19840/", NULL, NULL, SW_SHOW);
        }
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

    // Initialize Native WebView2 Application Window
    bool webviewSuccess = false;
    try {
        g_pWebView = std::make_unique<webview::webview>(false, nullptr);
        g_pWebView->set_title("DustFX — GPU Display & Gamma Optimizer");
        g_pWebView->set_size(1240, 820, WEBVIEW_HINT_NONE);
        
        g_hWebviewWnd = (HWND)g_pWebView->window().value();
        if (g_hWebviewWnd) {
            // Apply authentic purple DustFX icon to the window
            HICON hIconBig = (HICON)LoadImageA(GetModuleHandle(NULL), MAKEINTRESOURCE(1), IMAGE_ICON, 32, 32, LR_DEFAULTCOLOR);
            HICON hIconSmall = (HICON)LoadImageA(GetModuleHandle(NULL), MAKEINTRESOURCE(1), IMAGE_ICON, 16, 16, LR_DEFAULTCOLOR);
            if (!hIconBig) hIconBig = LoadIcon(GetModuleHandle(NULL), MAKEINTRESOURCE(1));
            if (!hIconSmall) hIconSmall = hIconBig;
            if (hIconBig) SendMessageA(g_hWebviewWnd, WM_SETICON, ICON_BIG, (LPARAM)hIconBig);
            if (hIconSmall) SendMessageA(g_hWebviewWnd, WM_SETICON, ICON_SMALL, (LPARAM)hIconSmall);

            // Subclass window procedure to handle WM_CLOSE -> hide to tray
            g_pOriginalWebviewWndProc = (WNDPROC)SetWindowLongPtrA(g_hWebviewWnd, GWLP_WNDPROC, (LONG_PTR)WebviewSubclassWndProc);
        }

        g_pWebView->navigate("http://127.0.0.1:19840/");
        webviewSuccess = true;
    } catch (const std::exception& e) {
        std::cerr << "[DustFX] WebView2 initialization failed: " << e.what() << std::endl;
        webviewSuccess = false;
    } catch (...) {
        std::cerr << "[DustFX] WebView2 initialization failed with unknown error." << std::endl;
        webviewSuccess = false;
    }

    if (webviewSuccess && g_pWebView) {
        // Run native WebView2 event message loop
        g_pWebView->run();
    } else {
        // Fallback: Open in default browser if WebView2 runtime is not present
        ShellExecuteA(NULL, "open", "http://127.0.0.1:19840/", NULL, NULL, SW_SHOW);
        MSG msg;
        while (GetMessage(&msg, NULL, 0, 0)) {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }
    }

    g_isExiting.store(true);
    app.Stop();
    if (hMutex) CloseHandle(hMutex);
    return 0;
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

