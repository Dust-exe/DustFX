#include "overlay/overlay_toast.h"
#include <iostream>
#include <cmath>
#include <algorithm>
#include <sstream>

#ifdef _WIN32
#include <windows.h>

static HWND g_hOverlayWnd = NULL;
static dustfx::DisplaySettings g_crosshairSettings;
static bool g_crosshairVisible = false;

// Chroma Key Color: Pure Magenta (255, 0, 255)
// Everything drawn with this exact color is 100% completely transparent & click-through.
#define TRANSPARENT_COLOR_KEY RGB(255, 0, 255)

// Helper: Parse hex color "#RRGGBB" to COLORREF
static COLORREF HexToColorRef(const std::string& hex) {
    std::string cleanHex = hex;
    if (!cleanHex.empty() && cleanHex[0] == '#') {
        cleanHex = cleanHex.substr(1);
    }
    if (cleanHex.length() < 6) return RGB(0, 255, 102);

    unsigned int r = 0, g = 255, b = 102;
    std::stringstream ss;
    ss << std::hex << cleanHex.substr(0, 2);
    ss >> r;
    ss.clear();
    ss << std::hex << cleanHex.substr(2, 2);
    ss >> g;
    ss.clear();
    ss << std::hex << cleanHex.substr(4, 2);
    ss >> b;

    // Guard against exact match with our transparency key (255, 0, 255)
    if (r == 255 && g == 0 && b == 255) {
        r = 254; b = 254;
    }
    return RGB(r, g, b);
}

// Windows Overlay Window Procedure
static LRESULT CALLBACK CrosshairWndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_ERASEBKGND:
            return 1; // Handled in WM_PAINT

        case WM_PAINT: {
            PAINTSTRUCT ps;
            HDC hdc = BeginPaint(hWnd, &ps);

            RECT rc;
            GetClientRect(hWnd, &rc);
            int w = rc.right - rc.left;
            int h = rc.bottom - rc.top;
            int cx = w / 2;
            int cy = h / 2;

            // Double buffering
            HDC memDC = CreateCompatibleDC(hdc);
            HBITMAP memBmp = CreateCompatibleBitmap(hdc, w, h);
            HBITMAP oldBmp = (HBITMAP)SelectObject(memDC, memBmp);

            // Fill background with TRANSPARENT_COLOR_KEY (RGB(255, 0, 255))
            HBRUSH transBrush = CreateSolidBrush(TRANSPARENT_COLOR_KEY);
            FillRect(memDC, &rc, transBrush);
            DeleteObject(transBrush);

            if (g_crosshairVisible) {
                COLORREF color = HexToColorRef(g_crosshairSettings.crosshairColor);
                int size = std::max(2, g_crosshairSettings.crosshairSize);
                int thickness = std::max(1, g_crosshairSettings.crosshairThickness);
                int gap = std::max(0, g_crosshairSettings.crosshairGap);
                int dotSize = g_crosshairSettings.crosshairDotSize;
                int outline = g_crosshairSettings.crosshairOutline;
                std::string style = g_crosshairSettings.crosshairStyle;

                // Color Brush and Pen
                HBRUSH colorBrush = CreateSolidBrush(color);
                HPEN colorPen = CreatePen(PS_SOLID, thickness, color);
                HPEN nullPen = (HPEN)GetStockObject(NULL_PEN);

                // True Black Outline Brush and Pen (0, 0, 0)
                HBRUSH outlineBrush = CreateSolidBrush(RGB(0, 0, 0));
                HPEN outlinePen = CreatePen(PS_SOLID, thickness + outline * 2, RGB(0, 0, 0));

                auto DrawOutlineRect = [&](int left, int top, int right, int bottom) {
                    if (outline > 0) {
                        RECT oRc = { left - outline, top - outline, right + outline, bottom + outline };
                        FillRect(memDC, &oRc, outlineBrush);
                    }
                };

                auto DrawFilledRect = [&](int left, int top, int right, int bottom) {
                    DrawOutlineRect(left, top, right, bottom);
                    RECT fRc = { left, top, right, bottom };
                    FillRect(memDC, &fRc, colorBrush);
                };

                int halfThick = thickness / 2;
                int tRem = thickness - halfThick;

                if (style == "dot") {
                    int r = size;
                    if (dotSize > 0) r = dotSize;
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
                    // Left
                    DrawFilledRect(cx - gap - size, cy - halfThick, cx - gap, cy + tRem);
                    // Right
                    DrawFilledRect(cx + gap, cy - halfThick, cx + gap + size, cy + tRem);
                    // Top
                    DrawFilledRect(cx - halfThick, cy - gap - size, cx + tRem, cy - gap);
                    // Bottom
                    DrawFilledRect(cx - halfThick, cy + gap, cx + tRem, cy + gap + size);
                }
                else if (style == "t-cross") {
                    // Left
                    DrawFilledRect(cx - gap - size, cy - halfThick, cx - gap, cy + tRem);
                    // Right
                    DrawFilledRect(cx + gap, cy - halfThick, cx + gap + size, cy + tRem);
                    // Bottom only (No top line)
                    DrawFilledRect(cx - halfThick, cy + gap, cx + tRem, cy + gap + size);
                }
                else if (style == "gap-cross") {
                    int bigGap = std::max(4, gap);
                    DrawFilledRect(cx - bigGap - size, cy - halfThick, cx - bigGap, cy + tRem);
                    DrawFilledRect(cx + bigGap, cy - halfThick, cx + bigGap + size, cy + tRem);
                    DrawFilledRect(cx - halfThick, cy - bigGap - size, cx + tRem, cy - bigGap);
                    DrawFilledRect(cx - halfThick, cy + bigGap, cx + tRem, cy + bigGap + size);
                }
                else if (style == "x-cross") {
                    int s = (int)(size * 0.707f);
                    int g = (int)(gap * 0.707f);
                    if (outline > 0) {
                        SelectObject(memDC, outlinePen);
                        MoveToEx(memDC, cx - g - s, cy - g - s, NULL);
                        LineTo(memDC, cx - g, cy - g);
                        MoveToEx(memDC, cx + g, cy + g, NULL);
                        LineTo(memDC, cx + g + s, cy + g + s);
                        MoveToEx(memDC, cx + g + s, cy - g - s, NULL);
                        LineTo(memDC, cx + g, cy - g);
                        MoveToEx(memDC, cx - g, cy + g, NULL);
                        LineTo(memDC, cx - g - s, cy + g + s);
                    }
                    SelectObject(memDC, colorPen);
                    MoveToEx(memDC, cx - g - s, cy - g - s, NULL);
                    LineTo(memDC, cx - g, cy - g);
                    MoveToEx(memDC, cx + g, cy + g, NULL);
                    LineTo(memDC, cx + g + s, cy + g + s);
                    MoveToEx(memDC, cx + g + s, cy - g - s, NULL);
                    LineTo(memDC, cx + g, cy - g);
                    MoveToEx(memDC, cx - g, cy + g, NULL);
                    LineTo(memDC, cx - g - s, cy + g + s);
                }
                else if (style == "circle") {
                    int r = size + gap;
                    SelectObject(memDC, GetStockObject(NULL_BRUSH));
                    if (outline > 0) {
                        SelectObject(memDC, outlinePen);
                        Ellipse(memDC, cx - r, cy - r, cx + r, cy + r);
                    }
                    SelectObject(memDC, colorPen);
                    Ellipse(memDC, cx - r, cy - r, cx + r, cy + r);
                }
                else if (style == "cross-dot") {
                    DrawFilledRect(cx - gap - size, cy - halfThick, cx - gap, cy + tRem);
                    DrawFilledRect(cx + gap, cy - halfThick, cx + gap + size, cy + tRem);
                    DrawFilledRect(cx - halfThick, cy - gap - size, cx + tRem, cy - gap);
                    DrawFilledRect(cx - halfThick, cy + gap, cx + tRem, cy + gap + size);
                    // Center dot
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

                // Explicit Center dot
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

                DeleteObject(colorBrush);
                DeleteObject(colorPen);
                DeleteObject(outlineBrush);
                DeleteObject(outlinePen);
            }

            // Transfer memory bitmap to layered window DC
            BitBlt(hdc, 0, 0, w, h, memDC, 0, 0, SRCCOPY);

            SelectObject(memDC, oldBmp);
            DeleteObject(memBmp);
            DeleteDC(memDC);
            EndPaint(hWnd, &ps);
            return 0;
        }

        case WM_DESTROY:
            g_hOverlayWnd = NULL;
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
#ifdef _WIN32
    if (m_hWnd) {
        DestroyWindow(m_hWnd);
        m_hWnd = NULL;
    }
#endif
}

void OverlayToast::Initialize() {
#ifdef _WIN32
    // Crosshair overlay suspended (v1.2) — CreateCrosshairWindow() devre dışı
    // Defender tetikleyicisi olan transparent topmost overlay penceresi artık oluşturulmuyor
#endif
    std::cout << "[OverlayToast] Toast notification engine initialized. Crosshair overlay suspended." << std::endl;
}

#ifdef _WIN32
void OverlayToast::CreateCrosshairWindow() {
    if (m_hWnd && IsWindow(m_hWnd)) return;

    HINSTANCE hInstance = GetModuleHandle(NULL);
    WNDCLASSEXA wc = {0};
    wc.cbSize = sizeof(WNDCLASSEXA);
    wc.lpfnWndProc = CrosshairWndProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = "DustFXCrosshairOverlayClass";
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    RegisterClassExA(&wc);

    // Continuous Screen Center & Aspect Ratio Alignment
    int screenW = GetSystemMetrics(SM_CXSCREEN);
    int screenH = GetSystemMetrics(SM_CYSCREEN);
    int overlaySize = 300; // 300x300 centered overlay
    int x = (screenW - overlaySize) / 2;
    int y = (screenH - overlaySize) / 2;

    // Create Transparent, Click-through, Topmost, Non-activating Layered Window
    m_hWnd = CreateWindowExA(
        WS_EX_TOPMOST | WS_EX_TRANSPARENT | WS_EX_LAYERED | WS_EX_NOACTIVATE | WS_EX_TOOLWINDOW,
        "DustFXCrosshairOverlayClass",
        "DustFXCrosshair",
        WS_POPUP,
        x, y, overlaySize, overlaySize,
        NULL, NULL, hInstance, NULL
    );

    if (m_hWnd) {
        g_hOverlayWnd = m_hWnd;
        // Pure Magenta (255, 0, 255) is keyed as 100% transparent click-through!
        SetLayeredWindowAttributes(m_hWnd, TRANSPARENT_COLOR_KEY, 0, LWA_COLORKEY);
        std::cout << "[OverlayToast] Created transparent click-through crosshair window at (" << x << ", " << y << ")" << std::endl;
    }
}
#endif

void OverlayToast::ShowToast(const std::string& title, const std::string& subtitle, int durationSeconds) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_title = title;
    m_subtitle = subtitle;
    m_expiresAt = std::chrono::steady_clock::now() + std::chrono::seconds(durationSeconds);

    std::cout << "[DustFX OSD] 🔔 " << title << (subtitle.empty() ? "" : " — " + subtitle) << std::endl;

#ifdef _WIN32
    MessageBeep(MB_ICONASTERISK);
#endif
}

void OverlayToast::ToggleCrosshair(bool enabled) {
    m_crosshairVisible.store(enabled);
#ifdef _WIN32
    g_crosshairVisible = enabled;
    if (m_hWnd && IsWindow(m_hWnd)) {
        if (enabled) {
            // Dynamic Screen Center & Aspect Ratio Alignment
            int screenW = GetSystemMetrics(SM_CXSCREEN);
            int screenH = GetSystemMetrics(SM_CYSCREEN);
            int overlaySize = 300;
            int x = (screenW - overlaySize) / 2;
            int y = (screenH - overlaySize) / 2;

            SetWindowPos(m_hWnd, HWND_TOPMOST, x, y, overlaySize, overlaySize, SWP_NOACTIVATE | SWP_SHOWWINDOW);
            RedrawWindow(m_hWnd, NULL, NULL, RDW_INVALIDATE | RDW_UPDATENOW | RDW_ERASE);
        } else {
            ShowWindow(m_hWnd, SW_HIDE);
        }
    }
#endif
    std::cout << "[OverlayToast] Crosshair overlay " << (enabled ? "ENABLED (ON SCREEN)" : "DISABLED") << std::endl;
}

void OverlayToast::UpdateCrosshair(const DisplaySettings& settings) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_crosshairSettings = settings;
    m_crosshairVisible.store(settings.crosshairEnabled);

#ifdef _WIN32
    g_crosshairSettings = settings;
    g_crosshairVisible = settings.crosshairEnabled;

    if (!m_hWnd || !IsWindow(m_hWnd)) {
        CreateCrosshairWindow();
    }

    if (m_hWnd && IsWindow(m_hWnd)) {
        if (settings.crosshairEnabled) {
            // Dynamic Screen Center & Aspect Ratio Alignment (4:3, 16:9, 16:10, 21:9 stretched/native)
            int screenW = GetSystemMetrics(SM_CXSCREEN);
            int screenH = GetSystemMetrics(SM_CYSCREEN);
            int overlaySize = 300;
            int x = (screenW - overlaySize) / 2;
            int y = (screenH - overlaySize) / 2;

            SetWindowPos(m_hWnd, HWND_TOPMOST, x, y, overlaySize, overlaySize, SWP_NOACTIVATE | SWP_SHOWWINDOW);
            RedrawWindow(m_hWnd, NULL, NULL, RDW_INVALIDATE | RDW_UPDATENOW | RDW_ERASE);
        } else {
            ShowWindow(m_hWnd, SW_HIDE);
        }
    }
#endif
}

} // namespace dustfx
