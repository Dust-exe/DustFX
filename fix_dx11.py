import os

cpp_code = """#include "overlay/overlay_toast.h"
#include <iostream>
#include <cmath>
#include <algorithm>
#include <string>
#include <thread>

#ifdef _WIN32
#include <dwmapi.h>
#include <dcomp.h>
#pragma comment(lib, "d3d11.lib")
#pragma comment(lib, "d2d1.lib")
#pragma comment(lib, "dwrite.lib")
#pragma comment(lib, "dxgi.lib")
#pragma comment(lib, "dwmapi.lib")
#pragma comment(lib, "dcomp.lib")

#ifndef WDA_EXCLUDEFROMCAPTURE
#define WDA_EXCLUDEFROMCAPTURE 0x00000011
#endif
#ifndef WS_EX_NOREDIRECTIONBITMAP
#define WS_EX_NOREDIRECTIONBITMAP 0x00200000L
#endif

#define WM_USER_UPDATE_CROSSHAIR     (WM_USER + 301)
#define WM_USER_UPDATE_SNIPER_ZOOM   (WM_USER + 303)
#define TIMER_ID_ZOOM_REFRESH        101
#define TIMER_ID_TOPMOST_HEARTBEAT   102

// Helper: Parse hex color "#RRGGBB" to D2D1::ColorF
static D2D1::ColorF HexToD2DColor(const std::string& hex, float alpha = 1.0f) {
    std::string cleanHex = hex;
    if (!cleanHex.empty() && cleanHex[0] == '#') {
        cleanHex = cleanHex.substr(1);
    }
    if (cleanHex.length() < 6) return D2D1::ColorF(0, 1.0f, 0.4f, alpha);

    try {
        unsigned long r = std::stoul(cleanHex.substr(0, 2), nullptr, 16);
        unsigned long g = std::stoul(cleanHex.substr(2, 2), nullptr, 16);
        unsigned long b = std::stoul(cleanHex.substr(4, 2), nullptr, 16);
        return D2D1::ColorF(r / 255.0f, g / 255.0f, b / 255.0f, alpha);
    } catch (...) {
        return D2D1::ColorF(0, 1.0f, 0.4f, alpha);
    }
}

// Windows Overlay Window Procedure
static LRESULT CALLBACK CrosshairWndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    auto toast = &dustfx::OverlayToast::Instance();
    switch (msg) {
        case WM_TIMER: {
            if (wParam == TIMER_ID_ZOOM_REFRESH && toast->IsSniperZoomActive()) {
                toast->RenderDX();
            } else if (wParam == TIMER_ID_TOPMOST_HEARTBEAT) {
                int screenW = GetSystemMetrics(SM_CXSCREEN);
                int screenH = GetSystemMetrics(SM_CYSCREEN);
                SetWindowPos(hWnd, HWND_TOPMOST, 0, 0, screenW, screenH, SWP_NOACTIVATE | SWP_NOMOVE | SWP_NOSIZE);
            }
            return 0;
        }

        case WM_USER_UPDATE_SNIPER_ZOOM:
        case WM_USER_UPDATE_CROSSHAIR: {
            int screenW = GetSystemMetrics(SM_CXSCREEN);
            int screenH = GetSystemMetrics(SM_CYSCREEN);

            SetWindowPos(hWnd, HWND_TOPMOST, 0, 0, screenW, screenH, SWP_NOACTIVATE | SWP_SHOWWINDOW);
            SetTimer(hWnd, TIMER_ID_TOPMOST_HEARTBEAT, 1000, NULL);
            if (toast->IsSniperZoomActive()) {
                SetTimer(hWnd, TIMER_ID_ZOOM_REFRESH, 16, NULL);
            } else {
                KillTimer(hWnd, TIMER_ID_ZOOM_REFRESH);
                toast->RenderDX();
            }
            return 0;
        }

        case WM_DISPLAYCHANGE: {
            PostMessage(hWnd, WM_USER_UPDATE_CROSSHAIR, 0, 0);
            return 0;
        }

        case WM_ERASEBKGND:
            return 1;
            
        case WM_PAINT: {
            PAINTSTRUCT ps;
            BeginPaint(hWnd, &ps);
            toast->RenderDX();
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
    std::cout << "[OverlayToast] Modern DX11/DComp Zero-Lag Engine initialized." << std::endl;
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
    }
}

#ifdef _WIN32
void OverlayToast::OverlayThreadProc() {
    HINSTANCE hInstance = GetModuleHandle(NULL);
    WNDCLASSEXA wc = {0};
    wc.cbSize = sizeof(WNDCLASSEXA);
    wc.lpfnWndProc = CrosshairWndProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = "DustFXCrosshairOverlayDX11";
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    // Background brush is NULL to prevent GDI painting over DX
    wc.hbrBackground = NULL;
    RegisterClassExA(&wc);

    int screenW = GetSystemMetrics(SM_CXSCREEN);
    int screenH = GetSystemMetrics(SM_CYSCREEN);

    m_hWnd = CreateWindowExA(
        WS_EX_TOPMOST | WS_EX_TRANSPARENT | WS_EX_NOACTIVATE | WS_EX_TOOLWINDOW | WS_EX_NOREDIRECTIONBITMAP,
        "DustFXCrosshairOverlayDX11",
        "DustFXCrosshairDX11",
        WS_POPUP,
        0, 0, screenW, screenH,
        NULL, NULL, hInstance, NULL
    );

    if (m_hWnd) {
        SetWindowDisplayAffinity(m_hWnd, WDA_EXCLUDEFROMCAPTURE);
        
        if (InitDirectX()) {
            std::cout << "[OverlayToast] DX11 DirectComposition Overlay initialized successfully." << std::endl;
        } else {
            std::cerr << "[OverlayToast] Failed to initialize DX11 DirectComposition Overlay!" << std::endl;
        }
    }

    MSG msg;
    while (m_running.load() && GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    CleanupDirectX();

    if (m_hWnd && IsWindow(m_hWnd)) {
        DestroyWindow(m_hWnd);
        m_hWnd = NULL;
    }
}

bool OverlayToast::InitDirectX() {
    HRESULT hr = D2D1CreateFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED, &m_d2dFactory);
    if (FAILED(hr)) return false;

    D3D_FEATURE_LEVEL featureLevels[] = { D3D_FEATURE_LEVEL_11_1, D3D_FEATURE_LEVEL_11_0, D3D_FEATURE_LEVEL_10_1, D3D_FEATURE_LEVEL_10_0 };
    hr = D3D11CreateDevice(
        nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr,
        D3D11_CREATE_DEVICE_BGRA_SUPPORT,
        featureLevels, ARRAYSIZE(featureLevels),
        D3D11_SDK_VERSION, &m_d3dDevice, nullptr, &m_d3dContext);
    if (FAILED(hr)) return false;

    IDXGIDevice* dxgiDevice = nullptr;
    hr = m_d3dDevice->QueryInterface(__uuidof(IDXGIDevice), (void**)&dxgiDevice);
    if (FAILED(hr)) return false;

    hr = m_d2dFactory->CreateDevice(dxgiDevice, &m_d2dDevice);
    if (FAILED(hr)) { dxgiDevice->Release(); return false; }

    hr = m_d2dDevice->CreateDeviceContext(D2D1_DEVICE_CONTEXT_OPTIONS_NONE, &m_d2dContext);
    if (FAILED(hr)) { dxgiDevice->Release(); return false; }

    IDXGIAdapter* dxgiAdapter = nullptr;
    dxgiDevice->GetAdapter(&dxgiAdapter);
    IDXGIFactory2* dxgiFactory = nullptr;
    dxgiAdapter->GetParent(__uuidof(IDXGIFactory2), (void**)&dxgiFactory);

    RECT rc;
    GetClientRect(m_hWnd, &rc);
    int width = rc.right - rc.left;
    int height = rc.bottom - rc.top;
    if(width == 0 || height == 0) { width = 1920; height = 1080; } // Fallback

    DXGI_SWAP_CHAIN_DESC1 swapChainDesc = {0};
    swapChainDesc.Width = width;
    swapChainDesc.Height = height;
    swapChainDesc.Format = DXGI_FORMAT_B8G8R8A8_UNORM;
    swapChainDesc.Stereo = FALSE;
    swapChainDesc.SampleDesc.Count = 1;
    swapChainDesc.SampleDesc.Quality = 0;
    swapChainDesc.BufferUsage = DXGI_USAGE_RENDER_TARGET_OUTPUT;
    swapChainDesc.BufferCount = 2;
    swapChainDesc.Scaling = DXGI_SCALING_STRETCH;
    swapChainDesc.SwapEffect = DXGI_SWAP_EFFECT_FLIP_SEQUENTIAL;
    swapChainDesc.AlphaMode = DXGI_ALPHA_MODE_PREMULTIPLIED; 
    swapChainDesc.Flags = 0;

    // Create swap chain for composition
    hr = dxgiFactory->CreateSwapChainForComposition(dxgiDevice, &swapChainDesc, nullptr, &m_swapChain);
    
    dxgiFactory->Release();
    dxgiAdapter->Release();
    dxgiDevice->Release();

    if (FAILED(hr)) return false;

    // Setup DirectComposition
    IDCompositionDevice* dcompDevice = nullptr;
    hr = DCompositionCreateDevice(dxgiDevice, __uuidof(IDCompositionDevice), (void**)&dcompDevice);
    if (FAILED(hr)) return false;

    IDCompositionTarget* dcompTarget = nullptr;
    hr = dcompDevice->CreateTargetForHwnd(m_hWnd, TRUE, &dcompTarget);
    if (FAILED(hr)) { dcompDevice->Release(); return false; }

    IDCompositionVisual* dcompVisual = nullptr;
    hr = dcompDevice->CreateVisual(&dcompVisual);
    if (FAILED(hr)) { dcompTarget->Release(); dcompDevice->Release(); return false; }

    hr = dcompVisual->SetContent(m_swapChain);
    if (FAILED(hr)) { dcompVisual->Release(); dcompTarget->Release(); dcompDevice->Release(); return false; }

    hr = dcompTarget->SetRoot(dcompVisual);
    if (FAILED(hr)) { dcompVisual->Release(); dcompTarget->Release(); dcompDevice->Release(); return false; }

    hr = dcompDevice->Commit();
    if (FAILED(hr)) { dcompVisual->Release(); dcompTarget->Release(); dcompDevice->Release(); return false; }
    
    // We can release these, DWM keeps a reference
    dcompVisual->Release();
    dcompTarget->Release();
    dcompDevice->Release();

    IDXGISurface* dxgiBackBuffer = nullptr;
    hr = m_swapChain->GetBuffer(0, __uuidof(IDXGISurface), (void**)&dxgiBackBuffer);
    if (FAILED(hr)) return false;

    D2D1_BITMAP_PROPERTIES1 bitmapProperties = D2D1::BitmapProperties1(
        D2D1_BITMAP_OPTIONS_TARGET | D2D1_BITMAP_OPTIONS_CANNOT_DRAW | D2D1_BITMAP_OPTIONS_GDI_COMPATIBLE,
        D2D1::PixelFormat(DXGI_FORMAT_B8G8R8A8_UNORM, D2D1_ALPHA_MODE_PREMULTIPLIED),
        96.0f, 96.0f
    );

    hr = m_d2dContext->CreateBitmapFromDxgiSurface(dxgiBackBuffer, &bitmapProperties, &m_d2dTargetBitmap);
    dxgiBackBuffer->Release();

    if (FAILED(hr)) return false;

    m_d2dContext->SetTarget(m_d2dTargetBitmap);
    
    return true;
}

void OverlayToast::CleanupDirectX() {
    if (m_d2dTargetBitmap) { m_d2dTargetBitmap->Release(); m_d2dTargetBitmap = nullptr; }
    if (m_swapChain) { m_swapChain->Release(); m_swapChain = nullptr; }
    if (m_d2dContext) { m_d2dContext->Release(); m_d2dContext = nullptr; }
    if (m_d2dDevice) { m_d2dDevice->Release(); m_d2dDevice = nullptr; }
    if (m_d2dFactory) { m_d2dFactory->Release(); m_d2dFactory = nullptr; }
    if (m_d3dContext) { m_d3dContext->Release(); m_d3dContext = nullptr; }
    if (m_d3dDevice) { m_d3dDevice->Release(); m_d3dDevice = nullptr; }
}

void OverlayToast::DrawCrosshairD2D(ID2D1DeviceContext* ctx, int cx, int cy, const DisplaySettings& settings) {
    float opacity = std::clamp(settings.crosshairOpacity, 0.1f, 1.0f);
    D2D1::ColorF color = HexToD2DColor(settings.crosshairColor, opacity);
    
    ID2D1SolidColorBrush* pColorBrush = nullptr;
    ID2D1SolidColorBrush* pOutlineBrush = nullptr;
    ctx->CreateSolidColorBrush(color, &pColorBrush);
    ctx->CreateSolidColorBrush(D2D1::ColorF(0, 0, 0, opacity), &pOutlineBrush);

    int size = std::max(2, settings.crosshairSize);
    int thickness = std::max(1, settings.crosshairThickness);
    int gap = std::max(0, settings.crosshairGap);
    int dotSize = settings.crosshairDotSize;
    int outline = std::max(0, settings.crosshairOutline);
    std::string style = settings.crosshairStyle;
    if (style.empty()) style = "gap_cross";

    float halfThick = thickness / 2.0f;
    float tRem = thickness - halfThick;
    
    auto DrawFilledRect = [&](float left, float top, float right, float bottom) {
        if (outline > 0) {
            D2D1_RECT_F oRc = D2D1::RectF(left - outline, top - outline, right + outline, bottom + outline);
            ctx->FillRectangle(oRc, pOutlineBrush);
        }
        D2D1_RECT_F fRc = D2D1::RectF(left, top, right, bottom);
        ctx->FillRectangle(fRc, pColorBrush);
    };

    if (style == "dot") {
        float r = dotSize > 0 ? dotSize : size;
        if (outline > 0) {
            ctx->FillEllipse(D2D1::Ellipse(D2D1::Point2F(cx, cy), r + outline, r + outline), pOutlineBrush);
        }
        ctx->FillEllipse(D2D1::Ellipse(D2D1::Point2F(cx, cy), r, r), pColorBrush);
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
    else if (style == "circle") {
        float r = size + gap;
        if (outline > 0) {
            ctx->DrawEllipse(D2D1::Ellipse(D2D1::Point2F(cx, cy), r, r), pOutlineBrush, thickness + outline * 2);
        }
        ctx->DrawEllipse(D2D1::Ellipse(D2D1::Point2F(cx, cy), r, r), pColorBrush, thickness);
    }

    if (dotSize > 0 && style != "dot") {
        if (outline > 0) {
            ctx->FillEllipse(D2D1::Ellipse(D2D1::Point2F(cx, cy), dotSize + outline, dotSize + outline), pOutlineBrush);
        }
        ctx->FillEllipse(D2D1::Ellipse(D2D1::Point2F(cx, cy), dotSize, dotSize), pColorBrush);
    }

    if (pColorBrush) pColorBrush->Release();
    if (pOutlineBrush) pOutlineBrush->Release();
}

void OverlayToast::RenderDX() {
    if (!m_d2dContext || !m_swapChain) return;

    m_d2dContext->BeginDraw();
    m_d2dContext->Clear(D2D1::ColorF(0.0f, 0.0f, 0.0f, 0.0f)); // Fully transparent background

    int screenW = GetSystemMetrics(SM_CXSCREEN);
    int screenH = GetSystemMetrics(SM_CYSCREEN);
    int cx = screenW / 2;
    int cy = screenH / 2;

    if (m_sniperZoomActive.load()) {
        // Sniper Zoom with DX11 and GDI Interop
        ID2D1GdiInteropRenderTarget* gdiInterop = nullptr;
        m_d2dContext->QueryInterface(__uuidof(ID2D1GdiInteropRenderTarget), (void**)&gdiInterop);
        if (gdiInterop) {
            HDC d2dDC = nullptr;
            gdiInterop->GetDC(D2D1_DC_INITIALIZE_MODE_COPY, &d2dDC);
            if (d2dDC) {
                float scale = std::clamp(m_crosshairSettings.sniperZoomScale, 1.2f, 4.0f);
                int zoomSize = std::clamp(m_crosshairSettings.sniperZoomSize, 100, 500);
                int srcW = std::max(10, (int)((float)zoomSize / scale));
                int srcH = std::max(10, (int)((float)zoomSize / scale));
                int srcX = cx - (srcW / 2);
                int srcY = cy - (srcH / 2);

                HDC screenDC = GetDC(NULL);
                if (screenDC) {
                    SetStretchBltMode(d2dDC, HALFTONE);
                    SetBrushOrgEx(d2dDC, 0, 0, NULL);
                    
                    // Center the zoomed area
                    int dstX = cx - (zoomSize / 2);
                    int dstY = cy - (zoomSize / 2);
                    
                    StretchBlt(d2dDC, dstX, dstY, zoomSize, zoomSize, screenDC, srcX, srcY, srcW, srcH, SRCCOPY);
                    ReleaseDC(NULL, screenDC);
                }
                gdiInterop->ReleaseDC(nullptr);
            }
            gdiInterop->Release();
        }

        // Draw Lens Border
        int borderW = std::max(1, m_crosshairSettings.sniperZoomBorderWidth);
        D2D1::ColorF borderColor = HexToD2DColor(m_crosshairSettings.sniperZoomBorderColor);
        ID2D1SolidColorBrush* pBorderBrush = nullptr;
        m_d2dContext->CreateSolidColorBrush(borderColor, &pBorderBrush);
        
        int zoomSize = std::clamp(m_crosshairSettings.sniperZoomSize, 100, 500);
        float radius = zoomSize / 2.0f;
        if (pBorderBrush) {
            if (m_crosshairSettings.sniperZoomShape == "circle") {
                m_d2dContext->DrawEllipse(D2D1::Ellipse(D2D1::Point2F(cx, cy), radius, radius), pBorderBrush, borderW);
            } else {
                D2D1_RECT_F rect = D2D1::RectF(cx - radius, cy - radius, cx + radius, cy + radius);
                m_d2dContext->DrawRectangle(rect, pBorderBrush, borderW);
            }
            pBorderBrush->Release();
        }

        if (m_crosshairVisible.load() || m_crosshairSettings.crosshairEnabled) {
            DrawCrosshairD2D(m_d2dContext, cx, cy, m_crosshairSettings);
        } else if (m_crosshairSettings.sniperZoomShowDot) {
            ID2D1SolidColorBrush* pDotBrush = nullptr;
            m_d2dContext->CreateSolidColorBrush(borderColor, &pDotBrush);
            if (pDotBrush) {
                m_d2dContext->FillEllipse(D2D1::Ellipse(D2D1::Point2F(cx, cy), 2, 2), pDotBrush);
                pDotBrush->Release();
            }
        }
    } else if (m_crosshairVisible.load() || m_crosshairSettings.crosshairEnabled) {
        DrawCrosshairD2D(m_d2dContext, cx, cy, m_crosshairSettings);
    }

    m_d2dContext->EndDraw();
    m_swapChain->Present(0, 0); // DXGI_SWAP_EFFECT_FLIP_SEQUENTIAL
}

void OverlayToast::ShowToast(const std::string& title, const std::string& subtitle, int durationSeconds) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_title = title;
    m_subtitle = subtitle;
    m_expiresAt = std::chrono::steady_clock::now() + std::chrono::seconds(durationSeconds);
}

void OverlayToast::ToggleCrosshair(bool enabled) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_crosshairVisible.store(enabled);
    m_crosshairSettings.crosshairEnabled = enabled;
#ifdef _WIN32
    if (m_hWnd && IsWindow(m_hWnd)) {
        PostMessage(m_hWnd, WM_USER_UPDATE_CROSSHAIR, 0, 0);
    }
#endif
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
    if (m_hWnd && IsWindow(m_hWnd)) {
        PostMessage(m_hWnd, WM_USER_UPDATE_CROSSHAIR, 0, 0);
    }
#endif
}

void OverlayToast::ToggleSniperZoom(bool active) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_sniperZoomActive.store(active);

#ifdef _WIN32
    if (m_hWnd && IsWindow(m_hWnd)) {
        PostMessage(m_hWnd, WM_USER_UPDATE_SNIPER_ZOOM, 0, 0);
    }
#endif
}

void OverlayToast::UpdateSniperZoom(const DisplaySettings& settings) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_crosshairSettings.sniperZoomEnabled = settings.sniperZoomEnabled;
    m_crosshairSettings.sniperZoomScale = settings.sniperZoomScale;
    m_crosshairSettings.sniperZoomSize = settings.sniperZoomSize;
    m_crosshairSettings.sniperZoomShape = settings.sniperZoomShape;
    m_crosshairSettings.sniperZoomMode = settings.sniperZoomMode;
    m_crosshairSettings.sniperZoomBorderColor = settings.sniperZoomBorderColor;
    m_crosshairSettings.sniperZoomBorderWidth = settings.sniperZoomBorderWidth;
    m_crosshairSettings.sniperZoomShowDot = settings.sniperZoomShowDot;

#ifdef _WIN32
    if (m_hWnd && IsWindow(m_hWnd)) {
        PostMessage(m_hWnd, WM_USER_UPDATE_SNIPER_ZOOM, 0, 0);
    }
#endif
}

void OverlayToast::RefreshOverlayPosition() {
#ifdef _WIN32
    if (m_hWnd && IsWindow(m_hWnd)) {
        PostMessage(m_hWnd, WM_USER_UPDATE_CROSSHAIR, 0, 0);
    }
#endif
}

} // namespace dustfx
#endif
"""
with open('src/overlay/overlay_toast.cpp', 'w') as f:
    f.write(cpp_code)

