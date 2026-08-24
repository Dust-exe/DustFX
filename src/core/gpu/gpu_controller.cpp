#include "core/gpu/gpu_controller.h"
#include <iostream>
#include <cmath>
#include <algorithm>

#ifdef _WIN32
#include <windows.h>

typedef struct {
    float transform[5][5];
} MAGCOLOREFFECT;

typedef BOOL (WINAPI *pfnMagInitialize)();
typedef BOOL (WINAPI *pfnMagUninitialize)();
typedef BOOL (WINAPI *pfnMagSetFullscreenColorEffect)(MAGCOLOREFFECT* pEffect);

static pfnMagInitialize s_MagInitialize = nullptr;
static pfnMagUninitialize s_MagUninitialize = nullptr;
static pfnMagSetFullscreenColorEffect s_MagSetFullscreenColorEffect = nullptr;
static HMODULE s_hMagDll = nullptr;
#endif

namespace dustfx {

GpuController& GpuController::Instance() {
    static GpuController instance;
    return instance;
}

GpuController::GpuController() = default;

GpuController::~GpuController() {
    Shutdown();
}

bool GpuController::Initialize() {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (m_initialized) return true;

#ifdef _WIN32
    if (!s_hMagDll) {
        s_hMagDll = LoadLibraryA("Magnification.dll");
        if (s_hMagDll) {
            s_MagInitialize = (pfnMagInitialize)GetProcAddress(s_hMagDll, "MagInitialize");
            s_MagUninitialize = (pfnMagUninitialize)GetProcAddress(s_hMagDll, "MagUninitialize");
            s_MagSetFullscreenColorEffect = (pfnMagSetFullscreenColorEffect)GetProcAddress(s_hMagDll, "MagSetFullscreenColorEffect");

            if (s_MagInitialize && s_MagInitialize()) {
                m_magInitialized = true;
                std::cout << "[GpuController] Windows Magnification API initialized successfully." << std::endl;
            }
        }
    }
#endif

    DetectVendor();
    m_currentSettings = DisplaySettings();
    m_initialized = true;

    std::cout << "[GpuController] Initialized. Detected GPU Vendor: " << GetVendorName() << std::endl;
    return true;
}

void GpuController::Shutdown() {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (!m_initialized) return;
    ResetToDefault(-1);

#ifdef _WIN32
    if (m_magInitialized && s_MagUninitialize) {
        s_MagUninitialize();
        m_magInitialized = false;
    }
    if (s_hMagDll) {
        FreeLibrary(s_hMagDll);
        s_hMagDll = nullptr;
    }
#endif

    m_initialized = false;
}

std::string GpuController::GetVendorName() const {
    switch (m_vendor) {
        case GpuVendor::NVIDIA: return "NVIDIA GeForce (Hardware NVAPI)";
        case GpuVendor::AMD:    return "AMD Radeon (Hardware Level)";
        case GpuVendor::INTEL:  return "Intel Iris / Arc";
        case GpuVendor::GENERIC:
        default:                return "DirectX / Windows DWM Hardware";
    }
}

DisplaySettings GpuController::GetCurrentSettings() const {
    std::lock_guard<std::mutex> lock(m_mutex);
    return m_currentSettings;
}

void GpuController::DetectVendor() {
#ifdef _WIN32
    HMODULE hNvApi = LoadLibraryA("nvapi64.dll");
    if (!hNvApi) hNvApi = LoadLibraryA("nvapi.dll");
    if (hNvApi) {
        m_vendor = GpuVendor::NVIDIA;
        FreeLibrary(hNvApi);
        return;
    }

    HMODULE hAmd = LoadLibraryA("atiadlxx.dll");
    if (!hAmd) hAmd = LoadLibraryA("atiadlxy.dll");
    if (hAmd) {
        m_vendor = GpuVendor::AMD;
        FreeLibrary(hAmd);
        return;
    }
#endif
    m_vendor = GpuVendor::GENERIC;
}

bool GpuController::ApplySettings(const DisplaySettings& settings, int monitorIndex) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_currentSettings = settings;

    bool gdiOk = ApplyGdiGammaRamp(settings, monitorIndex);
    bool magOk = ApplyMagnificationEffect(settings);

    return (gdiOk || magOk);
}

bool GpuController::SetGamma(float gamma, int monitorIndex) {
    DisplaySettings s = GetCurrentSettings();
    s.gamma = std::clamp(gamma, 0.5f, 3.0f);
    return ApplySettings(s, monitorIndex);
}

bool GpuController::SetDigitalVibrance(int percentage, int monitorIndex) {
    DisplaySettings s = GetCurrentSettings();
    s.digitalVibrance = std::clamp(percentage, 0, 100);
    return ApplySettings(s, monitorIndex);
}

bool GpuController::SetBrightness(float brightnessOffset, int monitorIndex) {
    DisplaySettings s = GetCurrentSettings();
    s.brightnessOffset = std::clamp(brightnessOffset, -1.0f, 1.0f);
    return ApplySettings(s, monitorIndex);
}

bool GpuController::SetContrast(float contrast, int monitorIndex) {
    DisplaySettings s = GetCurrentSettings();
    s.contrast = std::clamp(contrast, 0.5f, 2.5f);
    return ApplySettings(s, monitorIndex);
}

bool GpuController::SetRgbChannels(float red, float green, float blue, int monitorIndex) {
    DisplaySettings s = GetCurrentSettings();
    s.rgbRed = std::clamp(red, 0.2f, 2.0f);
    s.rgbGreen = std::clamp(green, 0.2f, 2.0f);
    s.rgbBlue = std::clamp(blue, 0.2f, 2.0f);
    return ApplySettings(s, monitorIndex);
}

bool GpuController::SetSharpness(float sharpness, int monitorIndex) {
    DisplaySettings s = GetCurrentSettings();
    s.sharpness = std::clamp(sharpness, 0.0f, 1.0f);
    return ApplySettings(s, monitorIndex);
}

bool GpuController::ResetToDefault(int monitorIndex) {
    DisplaySettings defaultSettings;
    return ApplySettings(defaultSettings, monitorIndex);
}

bool GpuController::ApplyGdiGammaRamp(const DisplaySettings& settings, int monitorIndex) {
#ifdef _WIN32
    WORD ramp[3][256];

    float gamma = std::max(0.1f, settings.gamma);
    float contrast = std::max(0.1f, settings.contrast);
    float bright = settings.brightnessOffset;

    for (int i = 0; i < 256; ++i) {
        float normalized = static_cast<float>(i) / 255.0f;

        // Mathematical Gamma curve
        float gVal = std::pow(normalized, 1.0f / gamma);

        // Contrast & Brightness adjustment
        float cVal = (gVal - 0.5f) * contrast + 0.5f + bright;

        // RGB Channel scales
        float r = std::clamp(cVal * settings.rgbRed, 0.0f, 1.0f);
        ramp[0][i] = static_cast<WORD>(r * 65535.0f);

        float g = std::clamp(cVal * settings.rgbGreen, 0.0f, 1.0f);
        ramp[1][i] = static_cast<WORD>(g * 65535.0f);

        float b = std::clamp(cVal * settings.rgbBlue, 0.0f, 1.0f);
        ramp[2][i] = static_cast<WORD>(b * 65535.0f);
    }

    bool anySuccess = false;

    // 1. Primary Display Context
    HDC hDC = CreateDCA("DISPLAY", NULL, NULL, NULL);
    if (hDC) {
        if (SetDeviceGammaRamp(hDC, ramp)) {
            anySuccess = true;
        }
        DeleteDC(hDC);
    }

    // 2. Also Apply to all enumerated monitors or target monitor
    DISPLAY_DEVICEA dd;
    dd.cb = sizeof(dd);
    for (int dev = 0; EnumDisplayDevicesA(NULL, dev, &dd, 0); ++dev) {
        if (dd.StateFlags & DISPLAY_DEVICE_ATTACHED_TO_DESKTOP) {
            if (monitorIndex == -1 || monitorIndex == dev) {
                HDC mDC = CreateDCA(dd.DeviceName, NULL, NULL, NULL);
                if (mDC) {
                    if (SetDeviceGammaRamp(mDC, ramp)) {
                        anySuccess = true;
                    }
                    DeleteDC(mDC);
                }
            }
        }
    }

    return anySuccess;
#else
    (void)settings;
    (void)monitorIndex;
    return true;
#endif
}

bool GpuController::ApplyMagnificationEffect(const DisplaySettings& settings) {
#ifdef _WIN32
    if (!m_magInitialized || !s_MagSetFullscreenColorEffect) {
        return false;
    }

    // Calculate saturation & vibrance matrix
    // Standard Luminance weights: R: 0.2126, G: 0.7152, B: 0.0722
    float sat = 1.0f + (static_cast<float>(settings.digitalVibrance) / 100.0f) * 1.5f;
    float invSat = 1.0f - sat;

    float rLum = 0.2126f * invSat;
    float gLum = 0.7152f * invSat;
    float bLum = 0.0722f * invSat;

    float c = settings.contrast;
    float gScale = (settings.gamma >= 1.0f) ? (1.0f + (settings.gamma - 1.0f) * 0.4f) : settings.gamma;
    float bright = settings.brightnessOffset;

    MAGCOLOREFFECT effect = {
        (rLum + sat) * settings.rgbRed * c * gScale,   gLum * settings.rgbGreen * c * gScale,        bLum * settings.rgbBlue * c * gScale,         0.0f, 0.0f,
        rLum * settings.rgbRed * c * gScale,          (gLum + sat) * settings.rgbGreen * c * gScale, bLum * settings.rgbBlue * c * gScale,         0.0f, 0.0f,
        rLum * settings.rgbRed * c * gScale,          gLum * settings.rgbGreen * c * gScale,        (bLum + sat) * settings.rgbBlue * c * gScale,  0.0f, 0.0f,
        0.0f,                                         0.0f,                                         0.0f,                                          1.0f, 0.0f,
        bright,                                       bright,                                       bright,                                        0.0f, 1.0f
    };

    return (s_MagSetFullscreenColorEffect(&effect) != FALSE);
#else
    (void)settings;
    return true;
#endif
}

} // namespace dustfx
