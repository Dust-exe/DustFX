#include "overlay/overlay_toast.h"
#include <iostream>
#include <cmath>
#include <algorithm>
#include <string>
#include <thread>

#ifdef _WIN32
#include <windows.h>

#ifndef WDA_EXCLUDEFROMCAPTURE
#define WDA_EXCLUDEFROMCAPTURE 0x00000011
#endif

#define WM_USER_UPDATE_CROSSHAIR     (WM_USER + 301)
#define WM_USER_UPDATE_SNIPER_ZOOM   (WM_USER + 303)
#define TIMER_ID_ZOOM_REFRESH        101
#define TIMER_ID_TOPMOST_HEARTBEAT   102
#define TRANSPARENT_COLOR_KEY RGB(255, 0, 255)

static HWND g_hOverlayWnd = NULL;
static dustfx::DisplaySettings g_crosshairSettings;
static bool g_crosshairVisible = false;
static bool g_sniperZoomActive = false;

// Helper: Parse hex color "#RRGGBB" to COLORREF
static COLORREF HexToColorRef(const std::string& hex) {
    std::string cleanHex = hex;
    if (!cleanHex.empty() && cleanHex[0] == '#') {
        cleanHex = cleanHex.substr(1);
    }
    if (cleanHex.length() < 6) return RGB(0, 255, 102);

    try {
        unsigned long r = std::stoul(cleanHex.substr(0, 2), nullptr, 16);
        unsigned long g = std::stoul(cleanHex.substr(2, 2), nullptr, 16);
        unsigned long b = std::stoul(cleanHex.substr(4, 2), nullptr, 16);

        // Guard against matching transparency chroma key (255, 0, 255)
        if (r == 255 && g == 0 && b == 255) {
            r = 254; b = 254;
        }
        return RGB((BYTE)r, (BYTE)g, (BYTE)b);
    } catch (...) {
        return RGB(0, 255, 102);
    }
}

// Render unmagnified, pixel-perfect crosshair directly onto DC at specified center (cx, cy)
static void RenderCrosshairOnDC(HDC memDC, int cx, int cy, const dustfx::DisplaySettings& settings) {
    COLORREF color = HexToColorRef(settings.crosshairColor);
    int size = std::max(2, settings.crosshairSize);
    int thickness = std::max(1, settings.crosshairThickness);
    int gap = std::max(0, settings.crosshairGap);
    int dotSize = settings.crosshairDotSize;
    int outline = std::max(0, settings.crosshairOutline);
    std::string style = settings.crosshairStyle;
    if (style.empty()) style = "gap_cross";

    HBRUSH colorBrush = CreateSolidBrush(color);
    HPEN colorPen = CreatePen(PS_SOLID, thickness, color);
    HPEN nullPen = (HPEN)GetStockObject(NULL_PEN);
    HBRUSH outlineBrush = CreateSolidBrush(RGB(0, 0, 0));

    HGDIOBJ oldBrush = GetCurrentObject(memDC, OBJ_BRUSH);
    HGDIOBJ oldPen = GetCurrentObject(memDC, OBJ_PEN);

    auto DrawFilledRect = [&](int left, int top, int right, int bottom) {
        if (outline > 0) {
            RECT oRc = { left - outline, top - outline, right + outline, bottom + outline };
            FillRect(memDC, &oRc, outlineBrush);
        }
        RECT fRc = { left, top, right, bottom };
        FillRect(memDC, &fRc, colorBrush);
    };

    int halfThick = thickness / 2;
    int tRem = thickness - halfThick;

    if (style == "dot") {
        int r = dotSize > 0 ? dotSize : size;
        if (outline > 0) {
            SelectObject(memDC, outlineBrush);
            SelectObject(memDC, nullPen);
            Ellipse(memDC, cx - r - outline, cy - r - outline, cx + r + outline, cy + r + outline);
        }
        SelectObject(memDC, colorBrush);
        SelectObject(memDC, nullPen);
        Ellipse(memDC, cx - r, cy - r, cx + r, cy + r);
    }
    else if (style == "cross") {
        DrawFilledRect(cx - gap - size, cy - halfThick, cx - gap, cy + tRem);
        DrawFilledRect(cx + gap, cy - halfThick, cx + gap + size, cy + tRem);
        DrawFilledRect(cx - halfThick, cy - gap - size, cx + tRem, cy - gap);
        DrawFilledRect(cx - halfThick, cy + gap, cx + tRem, cy + gap + size);
    }
    else if (style == "t-cross") {
        DrawFilledRect(cx - gap - size, cy - halfThick, cx - gap, cy + tRem);
        DrawFilledRect(cx + gap, cy - halfThick, cx + gap + size, cy + tRem);
        DrawFilledRect(cx - halfThick, cy + gap, cx + tRem, cy + gap + size);
    }
    else if (style == "gap-cross" || style == "gap_cross") {
        int bigGap = std::max(6, gap);
        DrawFilledRect(cx - bigGap - size, cy - halfThick, cx - bigGap, cy + tRem);
        DrawFilledRect(cx + bigGap, cy - halfThick, cx + bigGap + size, cy + tRem);
        DrawFilledRect(cx - halfThick, cy - bigGap - size, cx + tRem, cy - bigGap);
        DrawFilledRect(cx - halfThick, cy + bigGap, cx + tRem, cy + bigGap + size);
    }
    else if (style == "x-cross") {
        int s = (int)(size * 0.707f);
        int g = (int)(gap * 0.707f);
        HPEN outlinePen = CreatePen(PS_SOLID, thickness + outline * 2, RGB(0, 0, 0));
        if (outline > 0) {
            SelectObject(memDC, outlinePen);
            MoveToEx(memDC, cx - g - s, cy - g - s, NULL); LineTo(memDC, cx - g, cy - g);
            MoveToEx(memDC, cx + g, cy + g, NULL); LineTo(memDC, cx + g + s, cy + g + s);
            MoveToEx(memDC, cx + g + s, cy - g - s, NULL); LineTo(memDC, cx + g, cy - g);
            MoveToEx(memDC, cx - g, cy + g, NULL); LineTo(memDC, cx - g - s, cy + g + s);
        }
        SelectObject(memDC, colorPen);
        MoveToEx(memDC, cx - g - s, cy - g - s, NULL); LineTo(memDC, cx - g, cy - g);
        MoveToEx(memDC, cx + g, cy + g, NULL); LineTo(memDC, cx + g + s, cy + g + s);
        MoveToEx(memDC, cx + g + s, cy - g - s, NULL); LineTo(memDC, cx + g, cy - g);
        MoveToEx(memDC, cx - g, cy + g, NULL); LineTo(memDC, cx - g - s, cy + g + s);
        DeleteObject(outlinePen);
    }
    else if (style == "circle") {
        int r = size + gap;
        HPEN outlinePen = CreatePen(PS_SOLID, thickness + outline * 2, RGB(0, 0, 0));
        SelectObject(memDC, GetStockObject(NULL_BRUSH));
        if (outline > 0) {
            SelectObject(memDC, outlinePen);
            Ellipse(memDC, cx - r, cy - r, cx + r, cy + r);
        }
        SelectObject(memDC, colorPen);
        Ellipse(memDC, cx - r, cy - r, cx + r, cy + r);
        DeleteObject(outlinePen);
    }
    else if (style == "cross-dot") {
        DrawFilledRect(cx - gap - size, cy - halfThick, cx - gap, cy + tRem);
        DrawFilledRect(cx + gap, cy - halfThick, cx + gap + size, cy + tRem);
        DrawFilledRect(cx - halfThick, cy - gap - size, cx + tRem, cy - gap);
        DrawFilledRect(cx - halfThick, cy + gap, cx + tRem, cy + gap + size);
        int d = std::max(2, dotSize > 0 ? dotSize : thickness);
        if (outline > 0) {
            SelectObject(memDC, outlineBrush);
            SelectObject(memDC, nullPen);
            Ellipse(memDC, cx - d - outline, cy - d - outline, cx + d + outline, cy + d + outline);
        }
        SelectObject(memDC, colorBrush);
        SelectObject(memDC, nullPen);
        Ellipse(memDC, cx - d, cy - d, cx + d, cy + d);
    }
    else if (style == "square") {
        int halfS = size + gap;
        if (outline > 0) {
            RECT oRc = { cx - halfS - outline, cy - halfS - outline, cx + halfS + outline, cy + halfS + outline };
            FrameRect(memDC, &oRc, outlineBrush);
        }
        RECT sRc = { cx - halfS, cy - halfS, cx + halfS, cy + halfS };
        FrameRect(memDC, &sRc, colorBrush);
    }

    // Explicit Center Dot if enabled
    if (dotSize > 0 && style != "dot" && style != "cross-dot") {
        if (outline > 0) {
            SelectObject(memDC, outlineBrush);
            SelectObject(memDC, nullPen);
            Ellipse(memDC, cx - dotSize - outline, cy - dotSize - outline, cx + dotSize + outline, cy + dotSize + outline);
        }
        SelectObject(memDC, colorBrush);
        SelectObject(memDC, nullPen);
        Ellipse(memDC, cx - dotSize, cy - dotSize, cx + dotSize, cy + dotSize);
    }

    SelectObject(memDC, oldBrush);
    SelectObject(memDC, oldPen);

    DeleteObject(colorBrush);
    DeleteObject(colorPen);
    DeleteObject(outlineBrush);
}

// Windows Overlay Window Procedure — Double-Buffered Zero-Flicker Renderer with Zoom & Crosshair
static LRESULT CALLBACK CrosshairWndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_TIMER: {
            if (wParam == TIMER_ID_ZOOM_REFRESH && g_sniperZoomActive) {
                InvalidateRect(hWnd, NULL, FALSE);
            } else if (wParam == TIMER_ID_TOPMOST_HEARTBEAT) {
                int screenW = GetSystemMetrics(SM_CXSCREEN);
                int screenH = GetSystemMetrics(SM_CYSCREEN);
                
                if (g_sniperZoomActive) {
                    int zoomSize = std::clamp(g_crosshairSettings.sniperZoomSize, 100, 500);
                    int x = (screenW - zoomSize) / 2;
                    int y = (screenH - zoomSize) / 2;
                    SetWindowPos(hWnd, HWND_TOPMOST, x, y, zoomSize, zoomSize, SWP_NOACTIVATE | SWP_NOSENDCHANGING);
                } else if (g_crosshairVisible || g_crosshairSettings.crosshairEnabled) {
                    int overlaySize = 200;
                    int x = (screenW - overlaySize) / 2;
                    int y = (screenH - overlaySize) / 2;
                    SetWindowPos(hWnd, HWND_TOPMOST, x, y, overlaySize, overlaySize, SWP_NOACTIVATE | SWP_NOSENDCHANGING);
                } else {
                    SetWindowPos(hWnd, HWND_TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_NOSENDCHANGING);
                }
                
                // Extra safety to force it to top of Z-Order if it fell behind
                BringWindowToTop(hWnd);
            }
            return 0;
        }

        case WM_USER_UPDATE_SNIPER_ZOOM:
        case WM_USER_UPDATE_CROSSHAIR: {
            int screenW = GetSystemMetrics(SM_CXSCREEN);
            int screenH = GetSystemMetrics(SM_CYSCREEN);

            if (g_sniperZoomActive) {
                int zoomSize = std::clamp(g_crosshairSettings.sniperZoomSize, 100, 500);
                int x = (screenW - zoomSize) / 2;
                int y = (screenH - zoomSize) / 2;

                SetLayeredWindowAttributes(hWnd, TRANSPARENT_COLOR_KEY, 255, LWA_COLORKEY);
                SetWindowPos(hWnd, HWND_TOPMOST, x, y, zoomSize, zoomSize, SWP_NOACTIVATE | SWP_SHOWWINDOW);
                SetTimer(hWnd, TIMER_ID_ZOOM_REFRESH, 16, NULL); // 60 FPS live screen refresh
                SetTimer(hWnd, TIMER_ID_TOPMOST_HEARTBEAT, 250, NULL);
                InvalidateRect(hWnd, NULL, TRUE);
            }
            else if (g_crosshairVisible || g_crosshairSettings.crosshairEnabled) {
                KillTimer(hWnd, TIMER_ID_ZOOM_REFRESH);
                int overlaySize = 200;
                int x = (screenW - overlaySize) / 2;
                int y = (screenH - overlaySize) / 2;

                BYTE alpha = (BYTE)(std::clamp(g_crosshairSettings.crosshairOpacity, 0.1f, 1.0f) * 255.0f);
                if (alpha < 255) {
                    SetLayeredWindowAttributes(hWnd, TRANSPARENT_COLOR_KEY, alpha, LWA_COLORKEY | LWA_ALPHA);
                } else {
                    SetLayeredWindowAttributes(hWnd, TRANSPARENT_COLOR_KEY, 255, LWA_COLORKEY);
                }

                SetWindowPos(hWnd, HWND_TOPMOST, x, y, overlaySize, overlaySize, SWP_NOACTIVATE | SWP_SHOWWINDOW);
                SetTimer(hWnd, TIMER_ID_TOPMOST_HEARTBEAT, 250, NULL);
                InvalidateRect(hWnd, NULL, TRUE);
            } else {
                KillTimer(hWnd, TIMER_ID_ZOOM_REFRESH);
                KillTimer(hWnd, TIMER_ID_TOPMOST_HEARTBEAT);
                ShowWindow(hWnd, SW_HIDE);
            }
            return 0;
        }

        case WM_DISPLAYCHANGE: {
            if (g_sniperZoomActive || g_crosshairVisible) {
                PostMessage(hWnd, WM_USER_UPDATE_CROSSHAIR, 0, 0);
            }
            return 0;
        }

        case WM_ERASEBKGND:
            return 1;

        case WM_PAINT: {
            PAINTSTRUCT ps;
            HDC hdc = BeginPaint(hWnd, &ps);

            RECT rc;
            GetClientRect(hWnd, &rc);
            int w = rc.right - rc.left;
            int h = rc.bottom - rc.top;
            int cx = w / 2;
            int cy = h / 2;

            HDC memDC = CreateCompatibleDC(hdc);
            HBITMAP memBmp = CreateCompatibleBitmap(hdc, w, h);
            HBITMAP oldBmp = (HBITMAP)SelectObject(memDC, memBmp);

            HBRUSH transBrush = CreateSolidBrush(TRANSPARENT_COLOR_KEY);
            FillRect(memDC, &rc, transBrush);
            DeleteObject(transBrush);

            int screenW = GetSystemMetrics(SM_CXSCREEN);
            int screenH = GetSystemMetrics(SM_CYSCREEN);

            // ==========================================
            // CASE 1: SNIPER ZOOM LENS ACTIVE
            // ==========================================
            if (g_sniperZoomActive) {
                float scale = std::clamp(g_crosshairSettings.sniperZoomScale, 1.2f, 4.0f);
                int srcW = std::max(10, (int)((float)w / scale));
                int srcH = std::max(10, (int)((float)h / scale));
                int srcX = (screenW - srcW) / 2;
                int srcY = (screenH - srcH) / 2;

                HDC screenDC = GetDC(NULL);
                if (screenDC) {
                    SetStretchBltMode(memDC, HALFTONE);
                    SetBrushOrgEx(memDC, 0, 0, NULL);

                    HRGN clipRgn = NULL;
                    if (g_crosshairSettings.sniperZoomShape == "circle") {
                        clipRgn = CreateEllipticRgn(0, 0, w, h);
                        SelectClipRgn(memDC, clipRgn);
                    }

                    // Perform high-speed screen magnification
                    StretchBlt(memDC, 0, 0, w, h, screenDC, srcX, srcY, srcW, srcH, SRCCOPY);

                    if (clipRgn) {
                        SelectClipRgn(memDC, NULL);
                        DeleteObject(clipRgn);
                    }

                    ReleaseDC(NULL, screenDC);
                }

                // Draw Lens Border
                int borderW = std::max(1, g_crosshairSettings.sniperZoomBorderWidth);
                COLORREF borderColor = HexToColorRef(g_crosshairSettings.sniperZoomBorderColor);
                HPEN borderPen = CreatePen(PS_SOLID, borderW, borderColor);
                HPEN oldPen = (HPEN)SelectObject(memDC, borderPen);
                HBRUSH oldBrush = (HBRUSH)SelectObject(memDC, GetStockObject(NULL_BRUSH));

                if (g_crosshairSettings.sniperZoomShape == "circle") {
                    Ellipse(memDC, borderW / 2, borderW / 2, w - borderW / 2, h - borderW / 2);
                } else {
                    Rectangle(memDC, borderW / 2, borderW / 2, w - borderW / 2, h - borderW / 2);
                }

                SelectObject(memDC, oldPen);
                SelectObject(memDC, oldBrush);
                DeleteObject(borderPen);

                // CRITICAL REQUIREMENT: CROSSHAIR ZOOM ISOLATION
                // Render crosshair at 1x pixel-perfect resolution ON TOP of zoomed buffer!
                if (g_crosshairVisible || g_crosshairSettings.crosshairEnabled) {
                    RenderCrosshairOnDC(memDC, cx, cy, g_crosshairSettings);
                } else if (g_crosshairSettings.sniperZoomShowDot) {
                    // Draw clean 2px sniper laser center dot
                    HBRUSH dotBrush = CreateSolidBrush(borderColor);
                    HBRUSH oBrush = CreateSolidBrush(RGB(0, 0, 0));
                    RECT dotRcOutline = { cx - 3, cy - 3, cx + 4, cy + 4 };
                    FillRect(memDC, &dotRcOutline, oBrush);
                    RECT dotRc = { cx - 2, cy - 2, cx + 3, cy + 3 };
                    FillRect(memDC, &dotRc, dotBrush);
                    DeleteObject(dotBrush);
                    DeleteObject(oBrush);
                }
            }
            // ==========================================
            // CASE 2: STANDARD CROSSHAIR ONLY
            // ==========================================
            else if (g_crosshairVisible || g_crosshairSettings.crosshairEnabled) {
                RenderCrosshairOnDC(memDC, cx, cy, g_crosshairSettings);
            }

            BitBlt(hdc, 0, 0, w, h, memDC, 0, 0, SRCCOPY);
            SelectObject(memDC, oldBmp);
            DeleteObject(memBmp);
            DeleteDC(memDC);
            EndPaint(hWnd, &ps);
            return 0;
        }

        case WM_DESTROY:
            PostQuitMessage(0);
            return 0;

        default:
            return DefWindowProcA(hWnd, msg, wParam, lParam);
    }
}
#endif

namespace dustfx {

OverlayToast& OverlayToast::Instance() {
    static OverlayToast instance;
    return instance;
}

OverlayToast::OverlayToast() = default;

OverlayToast::~OverlayToast() {
    Shutdown();
}

void OverlayToast::Initialize() {
#ifdef _WIN32
    if (!m_running.load()) {
        m_running.store(true);
        m_overlayThread = std::thread(&OverlayToast::OverlayThreadProc, this);
    }
#endif
    std::cout << "[OverlayToast] Modern zero-lag crosshair & sniper zoom engine initialized." << std::endl;
}

void OverlayToast::Shutdown() {
    if (m_running.load()) {
        m_running.store(false);
#ifdef _WIN32
        if (m_hWnd && IsWindow(m_hWnd)) {
            PostMessage(m_hWnd, WM_CLOSE, 0, 0);
        }
#endif
        if (m_overlayThread.joinable()) {
            m_overlayThread.join();
        }
#ifdef _WIN32
        m_hWnd = NULL;
#endif
    }
}

#ifdef _WIN32
void OverlayToast::OverlayThreadProc() {
    HINSTANCE hInstance = GetModuleHandle(NULL);
    WNDCLASSEXA wc = {0};
    wc.cbSize = sizeof(WNDCLASSEXA);
    wc.lpfnWndProc = CrosshairWndProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = "DustFXCrosshairOverlayClass";
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    RegisterClassExA(&wc);

    int overlaySize = 200;
    m_hWnd = CreateWindowExA(
        WS_EX_TOPMOST | WS_EX_TRANSPARENT | WS_EX_LAYERED | WS_EX_NOACTIVATE | WS_EX_TOOLWINDOW,
        "DustFXCrosshairOverlayClass",
        "DustFXCrosshair",
        WS_POPUP,
        0, 0, overlaySize, overlaySize,
        NULL, NULL, hInstance, NULL
    );

    if (m_hWnd) {
        g_hOverlayWnd = m_hWnd;
        SetLayeredWindowAttributes(m_hWnd, TRANSPARENT_COLOR_KEY, 255, LWA_COLORKEY);
        std::cout << "[OverlayToast] Dedicated crosshair overlay message pump active." << std::endl;
    }

    MSG msg;
    while (m_running.load() && GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    if (m_hWnd && IsWindow(m_hWnd)) {
        DestroyWindow(m_hWnd);
        m_hWnd = NULL;
    }
}
#endif

void OverlayToast::ShowToast(const std::string& title, const std::string& subtitle, int durationSeconds) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_title = title;
    m_subtitle = subtitle;
    m_expiresAt = std::chrono::steady_clock::now() + std::chrono::seconds(durationSeconds);
    std::cout << "[DustFX OSD] 🔔 " << title << (subtitle.empty() ? "" : " — " + subtitle) << std::endl;
}

void OverlayToast::ToggleCrosshair(bool enabled) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_crosshairVisible.store(enabled);
    m_crosshairSettings.crosshairEnabled = enabled;
#ifdef _WIN32
    g_crosshairVisible = enabled;
    g_crosshairSettings = m_crosshairSettings;

    if (m_hWnd && IsWindow(m_hWnd)) {
        PostMessage(m_hWnd, WM_USER_UPDATE_CROSSHAIR, 0, 0);
    }
#endif
    std::cout << "[OverlayToast] Crosshair overlay " << (enabled ? "ENABLED (ON SCREEN)" : "DISABLED") << std::endl;
}

void OverlayToast::UpdateCrosshair(const DisplaySettings& settings) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_crosshairSettings.crosshairEnabled = settings.crosshairEnabled;
    m_crosshairSettings.crosshairStyle = settings.crosshairStyle;
    m_crosshairSettings.crosshairSize = settings.crosshairSize;
    m_crosshairSettings.crosshairColor = settings.crosshairColor;
    m_crosshairSettings.crosshairThickness = settings.crosshairThickness;
    m_crosshairSettings.crosshairGap = settings.crosshairGap;
    m_crosshairSettings.crosshairOutline = settings.crosshairOutline;
    m_crosshairSettings.crosshairDotSize = settings.crosshairDotSize;
    m_crosshairSettings.crosshairOpacity = settings.crosshairOpacity;
    m_crosshairVisible.store(settings.crosshairEnabled);

#ifdef _WIN32
    g_crosshairSettings = m_crosshairSettings;
    g_crosshairVisible = settings.crosshairEnabled;

    if (m_hWnd && IsWindow(m_hWnd)) {
        PostMessage(m_hWnd, WM_USER_UPDATE_CROSSHAIR, 0, 0);
    }
#endif
}

void OverlayToast::ToggleSniperZoom(bool active) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_sniperZoomActive.store(active);

#ifdef _WIN32
    g_sniperZoomActive = active;

    if (m_hWnd && IsWindow(m_hWnd)) {
        PostMessage(m_hWnd, WM_USER_UPDATE_SNIPER_ZOOM, 0, 0);
    }
#endif
    std::cout << "[OverlayToast] Sniper Zoom Lens " << (active ? "ACTIVE" : "INACTIVE") << std::endl;
}

void OverlayToast::UpdateSniperZoom(const DisplaySettings& settings) {
    std::lock_guard<std::mutex> lock(m_mutex);
    // Only update sniper zoom properties to avoid overwriting crosshair properties
    m_crosshairSettings.sniperZoomEnabled = settings.sniperZoomEnabled;
    m_crosshairSettings.sniperZoomScale = settings.sniperZoomScale;
    m_crosshairSettings.sniperZoomSize = settings.sniperZoomSize;
    m_crosshairSettings.sniperZoomShape = settings.sniperZoomShape;
    m_crosshairSettings.sniperZoomMode = settings.sniperZoomMode;
    m_crosshairSettings.sniperZoomBorderColor = settings.sniperZoomBorderColor;
    m_crosshairSettings.sniperZoomBorderWidth = settings.sniperZoomBorderWidth;
    m_crosshairSettings.sniperZoomShowDot = settings.sniperZoomShowDot;

#ifdef _WIN32
    g_crosshairSettings = m_crosshairSettings;
    if (m_hWnd && IsWindow(m_hWnd)) {
        PostMessage(m_hWnd, WM_USER_UPDATE_SNIPER_ZOOM, 0, 0);
    }
#endif
}

void OverlayToast::RefreshOverlayPosition() {
#ifdef _WIN32
    if (m_hWnd && IsWindow(m_hWnd)) {
        // Safe cross-thread invocation to enforce TOPMOST and visibility
        // Handles cases where it gets hidden behind full screen window games during alt-tabs
        PostMessage(m_hWnd, WM_USER_UPDATE_CROSSHAIR, 0, 0);
    }
#endif
}

} // namespace dustfx
