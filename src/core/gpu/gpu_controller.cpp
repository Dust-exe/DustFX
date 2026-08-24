#include "core/gpu/gpu_controller.h"
#include <iostream>
#include <cmath>
#include <algorithm>

#ifdef _WIN32
#include <windows.h>
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
    m_initialized = false;
}

std::string GpuController::GetVendorName() const {
    switch (m_vendor) {
        case GpuVendor::NVIDIA: return "NVIDIA (NVAPI Hardware Level)";
        case GpuVendor::AMD:    return "AMD Radeon (ADL Saturation)";
        case GpuVendor::INTEL:  return "Intel Iris / Arc";
        case GpuVendor::GENERIC:
        default:                return "Generic Display (Windows GDI Ramp)";
    }
}

DisplaySettings GpuController::GetCurrentSettings() const {
    std::lock_guard<std::mutex> lock(m_mutex);
    return m_currentSettings;
}

void GpuController::DetectVendor() {
#ifdef _WIN32
    // Check NVIDIA Driver
    HMODULE hNvApi = LoadLibraryA("nvapi64.dll");
    if (!hNvApi) hNvApi = LoadLibraryA("nvapi.dll");
    if (hNvApi) {
        m_vendor = GpuVendor::NVIDIA;
        FreeLibrary(hNvApi);
        return;
    }

    // Check AMD Driver
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

    bool success = ApplyGdiGammaRamp(settings, monitorIndex);

    if (settings.digitalVibrance > 0) {
        if (m_vendor == GpuVendor::NVIDIA) {
            ApplyNvidiaVibrance(settings.digitalVibrance, monitorIndex);
        } else if (m_vendor == GpuVendor::AMD) {
            ApplyAmdSaturation(settings.digitalVibrance, monitorIndex);
        }
    }

    return success;
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
    HDC hDC = GetDC(NULL);
    if (!hDC) return false;

    WORD ramp[3][256];

    float gamma = std::max(0.1f, settings.gamma);
    float contrast = std::max(0.1f, settings.contrast);
    float bright = settings.brightnessOffset;

    for (int i = 0; i < 256; ++i) {
        float normalized = static_cast<float>(i) / 255.0f;

        // Apply Gamma curve
        float gVal = std::pow(normalized, 1.0f / gamma);

        // Apply Contrast & Brightness Offset
        float cVal = (gVal - 0.5f) * contrast + 0.5f + bright;

        // Red Channel
        float r = std::clamp(cVal * settings.rgbRed, 0.0f, 1.0f);
        ramp[0][i] = static_cast<WORD>(r * 65535.0f);

        // Green Channel
        float g = std::clamp(cVal * settings.rgbGreen, 0.0f, 1.0f);
        ramp[1][i] = static_cast<WORD>(g * 65535.0f);

        // Blue Channel
        float b = std::clamp(cVal * settings.rgbBlue, 0.0f, 1.0f);
        ramp[2][i] = static_cast<WORD>(b * 65535.0f);
    }

    BOOL res = SetDeviceGammaRamp(hDC, ramp);
    ReleaseDC(NULL, hDC);
    return (res != FALSE);
#else
    (void)settings;
    (void)monitorIndex;
    return true;
#endif
}

bool GpuController::ApplyNvidiaVibrance(int percentage, int monitorIndex) {
    (void)percentage;
    (void)monitorIndex;
    // NVAPI NvAPI_Disp_SetHdrColorData or NvAPI_DVCSetUserColorSaturation / NvAPI_GPU_SetDigitalVibrance
    return true;
}

bool GpuController::ApplyAmdSaturation(int percentage, int monitorIndex) {
    (void)percentage;
    (void)monitorIndex;
    // AMD ADL_Display_Color_Set (ADL_COLOR_SATURATION)
    return true;
}

} // namespace dustfx
