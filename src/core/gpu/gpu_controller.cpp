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

// NVIDIA NVAPI Driver Interface
typedef void* (*pfnNvAPI_QueryInterface)(unsigned int offset);
typedef int (*pfnNvAPI_Initialize)();
typedef int (*pfnNvAPI_EnumPhysicalGPUs)(void* phPhysicalGPUArray[64], int* pGpuCount);
typedef int (*pfnNvAPI_GPU_GetDVCInfoEx)(void* hPhysicalGpu, unsigned int outputId, void* pDVCInfo);
typedef int (*pfnNvAPI_GPU_SetDVCLevelEx)(void* hPhysicalGpu, unsigned int outputId, void* pDVCInfo);

static HMODULE s_hNvApiDll = nullptr;
static pfnNvAPI_QueryInterface s_NvAPI_QueryInterface = nullptr;
static pfnNvAPI_Initialize s_NvAPI_Initialize = nullptr;
static pfnNvAPI_EnumPhysicalGPUs s_NvAPI_EnumPhysicalGPUs = nullptr;
static pfnNvAPI_GPU_GetDVCInfoEx s_NvAPI_GPU_GetDVCInfoEx = nullptr;
static pfnNvAPI_GPU_SetDVCLevelEx s_NvAPI_GPU_SetDVCLevelEx = nullptr;

typedef struct {
    unsigned int version;
    int currentLevel;
    int minLevel;
    int maxLevel;
    int defaultLevel;
} NV_DISPLAY_DVC_INFO_EX;

#define NV_DISPLAY_DVC_INFO_EX_VER (sizeof(NV_DISPLAY_DVC_INFO_EX) | 0x10000)
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
    // 1. Initialize NVIDIA NVAPI Hardware Engine
    if (!s_hNvApiDll) {
        s_hNvApiDll = LoadLibraryA("nvapi64.dll");
        if (!s_hNvApiDll) s_hNvApiDll = LoadLibraryA("nvapi.dll");
        if (s_hNvApiDll) {
            s_NvAPI_QueryInterface = (pfnNvAPI_QueryInterface)GetProcAddress(s_hNvApiDll, "nvapi_QueryInterface");
            if (s_NvAPI_QueryInterface) {
                s_NvAPI_Initialize = (pfnNvAPI_Initialize)s_NvAPI_QueryInterface(0x0150E828);
                s_NvAPI_EnumPhysicalGPUs = (pfnNvAPI_EnumPhysicalGPUs)s_NvAPI_QueryInterface(0xE5AC921F);
                s_NvAPI_GPU_GetDVCInfoEx = (pfnNvAPI_GPU_GetDVCInfoEx)s_NvAPI_QueryInterface(0x0E45002D);
                s_NvAPI_GPU_SetDVCLevelEx = (pfnNvAPI_GPU_SetDVCLevelEx)s_NvAPI_QueryInterface(0x4A82C2B1);

                if (s_NvAPI_Initialize && s_NvAPI_Initialize() == 0) {
                    m_nvapiInitialized = true;
                    m_vendor = GpuVendor::NVIDIA;
                    std::cout << "[GpuController] NVIDIA NVAPI Hardware Digital Vibrance driver initialized." << std::endl;
                }
            }
        }
    }

    // 2. Initialize Windows Magnification API as Fallback/Matrix Engine
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
    if (s_hNvApiDll) {
        FreeLibrary(s_hNvApiDll);
        s_hNvApiDll = nullptr;
        m_nvapiInitialized = false;
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

bool GpuController::ApplyNvapiVibrance(int percentage, int monitorIndex) {
    (void)monitorIndex;
#ifdef _WIN32
    if (!m_nvapiInitialized || !s_NvAPI_EnumPhysicalGPUs || !s_NvAPI_GPU_SetDVCLevelEx) {
        return false;
    }

    void* gpus[64] = {0};
    int gpuCount = 0;
    if (s_NvAPI_EnumPhysicalGPUs(gpus, &gpuCount) != 0 || gpuCount == 0) {
        return false;
    }

    int vib = std::clamp(percentage, 0, 100);
    bool anyGpuSuccess = false;

    for (int g = 0; g < gpuCount; ++g) {
        if (!gpus[g]) continue;
        for (unsigned int outId = 0; outId < 8; ++outId) {
            // Try both direct outputId and bitmask (1 << outId)
            unsigned int outputIds[2] = { outId, 1u << outId };

            for (unsigned int actualOutId : outputIds) {
                NV_DISPLAY_DVC_INFO_EX dvcInfo = {0};
                dvcInfo.version = NV_DISPLAY_DVC_INFO_EX_VER;

                if (s_NvAPI_GPU_GetDVCInfoEx && s_NvAPI_GPU_GetDVCInfoEx(gpus[g], actualOutId, &dvcInfo) == 0) {
                    int minL = dvcInfo.minLevel;
                    int maxL = dvcInfo.maxLevel;
                    int targetL = minL + static_cast<int>((static_cast<float>(vib) / 100.0f) * (maxL - minL));

                    NV_DISPLAY_DVC_INFO_EX setInfo = {0};
                    setInfo.version = NV_DISPLAY_DVC_INFO_EX_VER;
                    setInfo.currentLevel = targetL;

                    if (s_NvAPI_GPU_SetDVCLevelEx(gpus[g], actualOutId, &setInfo) == 0) {
                        anyGpuSuccess = true;
                    }
                } else {
                    NV_DISPLAY_DVC_INFO_EX setInfo = {0};
                    setInfo.version = NV_DISPLAY_DVC_INFO_EX_VER;
                    setInfo.currentLevel = vib;
                    if (s_NvAPI_GPU_SetDVCLevelEx(gpus[g], actualOutId, &setInfo) == 0) {
                        anyGpuSuccess = true;
                    }
                }
            }
        }
    }
    return anyGpuSuccess;
#else
    (void)percentage;
    return false;
#endif
}

bool GpuController::ApplySettings(const DisplaySettings& settings, int monitorIndex) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_currentSettings = settings;

    bool gdiOk = ApplyGdiGammaRamp(settings, monitorIndex);
    bool nvOk = ApplyNvapiVibrance(settings.digitalVibrance, monitorIndex);
    bool magOk = ApplyMagnificationEffect(settings);

    return (gdiOk || nvOk || magOk);
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
    float sharpness = std::clamp(settings.sharpness, 0.0f, 1.0f);
    float shadowDetail = std::clamp(settings.shadowDetail, 0.0f, 1.0f);
    float vibrance = static_cast<float>(std::clamp(settings.digitalVibrance, 0, 100)) / 100.0f;

    // Color Temperature: Kelvin to RGB multipliers (Tanner Helland algorithm)
    float tempK = std::clamp(settings.colorTemperature, 2700.0f, 10000.0f);
    float tempR = 1.0f, tempG = 1.0f, tempB = 1.0f;
    {
        float temp = tempK / 100.0f;
        // Red
        if (temp <= 66.0f) {
            tempR = 1.0f;
        } else {
            tempR = 1.292936186f * std::pow(temp - 60.0f, -0.1332047592f);
        }
        // Green
        if (temp <= 66.0f) {
            tempG = 0.3900815788f * std::log(temp) - 0.6318414438f;
        } else {
            tempG = 1.129890861f * std::pow(temp - 60.0f, -0.0755148492f);
        }
        // Blue
        if (temp >= 66.0f) {
            tempB = 1.0f;
        } else if (temp <= 19.0f) {
            tempB = 0.0f;
        } else {
            tempB = 0.5432067891f * std::log(temp - 10.0f) - 1.19625408f;
        }
        tempR = std::clamp(tempR, 0.0f, 1.5f);
        tempG = std::clamp(tempG, 0.0f, 1.5f);
        tempB = std::clamp(tempB, 0.0f, 1.5f);

        // Normalize so that 6500K = identity (no shift)
        float t65 = 65.0f;
        float norm6500G = 0.3900815788f * std::log(t65) - 0.6318414438f;
        float norm6500B = 0.5432067891f * std::log(t65 - 10.0f) - 1.19625408f;
        tempR = tempR / 1.0f;
        tempG = tempG / std::max(0.001f, norm6500G);
        tempB = tempB / std::max(0.001f, norm6500B);
    }

    // Saturation multiplier for GDI ramp fallback (Rec. 709 luminance)
    float satScale = 1.0f + vibrance * 0.75f;

    for (int i = 0; i < 256; ++i) {
        float normalized = static_cast<float>(i) / 255.0f;

        // 1. Mathematical Gamma curve
        float gVal = std::pow(normalized, 1.0f / gamma);

        // 2. Shadow Detail Recovery (Toe curve)
        if (shadowDetail > 0.001f) {
            float toePoint = 0.20f;
            float liftAmount = shadowDetail * 0.25f;
            if (gVal < toePoint) {
                float t = gVal / toePoint;
                float lifted = gVal + liftAmount * (1.0f - t * t) * toePoint;
                gVal = lifted;
            } else if (gVal < toePoint * 2.0f) {
                float blend = (gVal - toePoint) / toePoint;
                float lifted = gVal + liftAmount * (1.0f - blend) * 0.3f * toePoint;
                gVal = lifted;
            }
        }

        // 3. Enhanced CAS (Contrast Adaptive Sharpening) — Unsharp Mask LUT
        if (sharpness > 0.001f) {
            float midPoint = 0.5f;
            float distFromMid = gVal - midPoint;
            float absDistFromMid = std::abs(distFromMid);

            float sCurveStrength = sharpness * 0.35f;
            float sCurve = midPoint + distFromMid * (1.0f + sCurveStrength * (1.0f - absDistFromMid * 2.0f));

            float localGradient = std::sin(normalized * 3.14159265f);
            float bandPass = localGradient * (1.0f - absDistFromMid * 1.5f);
            float edgeEnhance = sharpness * 0.20f * bandPass;

            gVal = std::clamp(sCurve + edgeEnhance, 0.0f, 1.0f);
        }

        // 4. Contrast & Brightness adjustment
        float cVal = (gVal - 0.5f) * contrast + 0.5f + bright;

        // 5. RGB Channel scales + Color Temperature + Saturation boost
        float rVal = cVal * settings.rgbRed * tempR;
        float gChannelVal = cVal * settings.rgbGreen * tempG;
        float bVal = cVal * settings.rgbBlue * tempB;

        // Apply saturation contrast to RGB
        float lum = 0.2126f * rVal + 0.7152f * gChannelVal + 0.0722f * bVal;
        float finalR = std::clamp(lum + (rVal - lum) * satScale, 0.0f, 1.0f);
        float finalG = std::clamp(lum + (gChannelVal - lum) * satScale, 0.0f, 1.0f);
        float finalB = std::clamp(lum + (bVal - lum) * satScale, 0.0f, 1.0f);

        ramp[0][i] = static_cast<WORD>(finalR * 65535.0f);
        ramp[1][i] = static_cast<WORD>(finalG * 65535.0f);
        ramp[2][i] = static_cast<WORD>(finalB * 65535.0f);
    }

    bool anySuccess = false;

    // 1. Primary Desktop Screen Context (Universal Direct Access)
    HDC hdcPrimary = GetDC(NULL);
    if (hdcPrimary) {
        if (SetDeviceGammaRamp(hdcPrimary, ramp)) {
            anySuccess = true;
        }
        ReleaseDC(NULL, hdcPrimary);
    }

    // 2. Also Apply to target or all enumerated monitors
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
    if (!s_MagSetFullscreenColorEffect) {
        return false;
    }

    // Lazy initialize magnification if not yet initialized
    if (!m_magInitialized && s_MagInitialize) {
        if (s_MagInitialize()) {
            m_magInitialized = true;
        }
    }

    if (!m_magInitialized) {
        return false;
    }

    // Standard Digital Vibrance (Color Saturation Matrix)
    float sat = 1.0f + (static_cast<float>(settings.digitalVibrance) / 100.0f) * 1.6f;
    float invSat = 1.0f - sat;

    // Rec. 709 Luminance weights: R: 0.2126, G: 0.7152, B: 0.0722
    float rL = 0.2126f * invSat;
    float gL = 0.7152f * invSat;
    float bL = 0.0722f * invSat;

    float c = settings.contrast;
    float bright = settings.brightnessOffset;

    MAGCOLOREFFECT effect = {
        {
            { (rL + sat) * settings.rgbRed * c, rL * settings.rgbGreen * c,         rL * settings.rgbBlue * c,         0.0f, 0.0f },
            { gL * settings.rgbRed * c,         (gL + sat) * settings.rgbGreen * c, gL * settings.rgbBlue * c,         0.0f, 0.0f },
            { bL * settings.rgbRed * c,         bL * settings.rgbGreen * c,         (bL + sat) * settings.rgbBlue * c, 0.0f, 0.0f },
            { 0.0f,                             0.0f,                               0.0f,                              1.0f, 0.0f },
            { bright,                           bright,                             bright,                            0.0f, 1.0f }
        }
    };

    return (s_MagSetFullscreenColorEffect(&effect) != FALSE);
#else
    (void)settings;
    return true;
#endif
}

} // namespace dustfx
