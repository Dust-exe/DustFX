#include "core/gpu/gpu_controller.h"
#include <iostream>
#include <cmath>
#include <algorithm>
#include <thread>
#include <atomic>
#include <mutex>
#include <chrono>

#ifdef _WIN32
#include <windows.h>

// ===================== MAGNIFICATION API =====================
typedef struct {
    float transform[5][5];
} MAGCOLOREFFECT;

typedef BOOL (WINAPI *pfnMagInitialize)();
typedef BOOL (WINAPI *pfnMagUninitialize)();
typedef BOOL (WINAPI *pfnMagSetFullscreenColorEffect)(MAGCOLOREFFECT* pEffect);

static HMODULE s_hMagDll = nullptr;
static pfnMagInitialize s_MagInitialize = nullptr;
static pfnMagUninitialize s_MagUninitialize = nullptr;
static pfnMagSetFullscreenColorEffect s_MagSetFullscreenColorEffect = nullptr;
static std::atomic<bool> s_magRunning{false};
static std::thread s_magThread;
static MAGCOLOREFFECT s_magCurrentEffect{};
static std::mutex s_magMutex;
static std::atomic<bool> s_magPending{false};

static MAGCOLOREFFECT MakeIdentityEffect() {
    MAGCOLOREFFECT eff = {};
    for (int i = 0; i < 5; ++i) eff.transform[i][i] = 1.0f;
    return eff;
}

// Magnification runs on its own message-loop thread so DWM always accepts the call
static void MagnificationThreadProc() {
    // Load dll inside this thread
    HMODULE hMag = LoadLibraryA("Magnification.dll");
    if (!hMag) return;

    auto fnInit = (pfnMagInitialize)GetProcAddress(hMag, "MagInitialize");
    auto fnSet  = (pfnMagSetFullscreenColorEffect)GetProcAddress(hMag, "MagSetFullscreenColorEffect");
    auto fnUninit = (pfnMagUninitialize)GetProcAddress(hMag, "MagUninitialize");

    if (!fnInit || !fnSet) { FreeLibrary(hMag); return; }
    if (!fnInit()) { FreeLibrary(hMag); return; }

    std::cout << "[GpuController] Magnification thread running (dedicated message loop)." << std::endl;

    // Message loop: apply effect whenever flagged, and keep re-applying every 500ms to ensure persistence
    while (s_magRunning.load()) {
        if (s_magPending.exchange(false)) {
            MAGCOLOREFFECT eff;
            { std::lock_guard<std::mutex> lk(s_magMutex); eff = s_magCurrentEffect; }
            fnSet(&eff);
        }
        // Re-apply periodically in case DWM resets it (e.g. after focus change, UAC)
        {
            MAGCOLOREFFECT eff;
            { std::lock_guard<std::mutex> lk(s_magMutex); eff = s_magCurrentEffect; }
            fnSet(&eff);
        }
        // Pump messages then sleep
        MSG msg;
        while (PeekMessageA(&msg, NULL, 0, 0, PM_REMOVE)) {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(500));
    }

    if (fnUninit) fnUninit();
    FreeLibrary(hMag);
}

// ===================== NVIDIA NVAPI =====================
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
    // 1. NVIDIA NVAPI
    if (!s_hNvApiDll) {
        s_hNvApiDll = LoadLibraryA("nvapi64.dll");
        if (!s_hNvApiDll) s_hNvApiDll = LoadLibraryA("nvapi.dll");
        if (s_hNvApiDll) {
            s_NvAPI_QueryInterface = (pfnNvAPI_QueryInterface)GetProcAddress(s_hNvApiDll, "nvapi_QueryInterface");
            if (s_NvAPI_QueryInterface) {
                s_NvAPI_Initialize        = (pfnNvAPI_Initialize)s_NvAPI_QueryInterface(0x0150E828);
                s_NvAPI_EnumPhysicalGPUs  = (pfnNvAPI_EnumPhysicalGPUs)s_NvAPI_QueryInterface(0xE5AC921F);
                s_NvAPI_GPU_GetDVCInfoEx  = (pfnNvAPI_GPU_GetDVCInfoEx)s_NvAPI_QueryInterface(0x0E45002D);
                s_NvAPI_GPU_SetDVCLevelEx = (pfnNvAPI_GPU_SetDVCLevelEx)s_NvAPI_QueryInterface(0x4A82C2B1);

                if (s_NvAPI_Initialize && s_NvAPI_Initialize() == 0) {
                    m_nvapiInitialized = true;
                    m_vendor = GpuVendor::NVIDIA;
                    std::cout << "[GpuController] NVIDIA NVAPI Hardware DVC initialized." << std::endl;
                }
            }
        }
    }

    // 2. Magnification — start dedicated thread with its own message loop
    if (!s_magRunning.load()) {
        // Init default identity matrix (no effect)
        {
            std::lock_guard<std::mutex> ml(s_magMutex);
            s_magCurrentEffect = MakeIdentityEffect();
        }
        s_magRunning.store(true);
        s_magThread = std::thread(MagnificationThreadProc);
        m_magInitialized = true;
    }
#endif

    DetectVendor();
    m_currentSettings = DisplaySettings();
    m_initialized = true;
    std::cout << "[GpuController] Initialized. GPU: " << GetVendorName() << std::endl;
    return true;
}

void GpuController::Shutdown() {
    std::lock_guard<std::mutex> lock(m_mutex);
    if (!m_initialized) return;

#ifdef _WIN32
    s_magRunning.store(false);
    if (s_magThread.joinable()) s_magThread.join();

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
        case GpuVendor::NVIDIA:  return "NVIDIA GeForce (Hardware NVAPI)";
        case GpuVendor::AMD:     return "AMD Radeon";
        case GpuVendor::INTEL:   return "Intel Iris / Arc";
        default:                 return "Generic (GDI+DWM)";
    }
}

DisplaySettings GpuController::GetCurrentSettings() const {
    std::lock_guard<std::mutex> lock(m_mutex);
    return m_currentSettings;
}

void GpuController::DetectVendor() {
#ifdef _WIN32
    if (m_nvapiInitialized) { m_vendor = GpuVendor::NVIDIA; return; }
    HMODULE hAmd = LoadLibraryA("atiadlxx.dll");
    if (!hAmd) hAmd = LoadLibraryA("atiadlxy.dll");
    if (hAmd) { m_vendor = GpuVendor::AMD; FreeLibrary(hAmd); return; }
#endif
    m_vendor = GpuVendor::GENERIC;
}

bool GpuController::ApplyNvapiVibrance(int percentage, int /*monitorIndex*/) {
#ifdef _WIN32
    if (!m_nvapiInitialized || !s_NvAPI_EnumPhysicalGPUs || !s_NvAPI_GPU_SetDVCLevelEx)
        return false;

    void* gpus[64] = {};
    int gpuCount = 0;
    if (s_NvAPI_EnumPhysicalGPUs(gpus, &gpuCount) != 0 || gpuCount == 0)
        return false;

    int vib = std::clamp(percentage, 0, 100);
    bool ok = false;

    for (int g = 0; g < gpuCount; ++g) {
        if (!gpus[g]) continue;
        // Try outputId as bitmask (correct NVAPI convention)
        for (int bit = 0; bit < 5; ++bit) {
            unsigned int outId = (1u << bit);

            NV_DISPLAY_DVC_INFO_EX info = {};
            info.version = NV_DISPLAY_DVC_INFO_EX_VER;

            if (s_NvAPI_GPU_GetDVCInfoEx && s_NvAPI_GPU_GetDVCInfoEx(gpus[g], outId, &info) == 0) {
                // Map percentage to driver range
                int target = info.minLevel + (int)((float)vib / 100.0f * (info.maxLevel - info.minLevel));
                NV_DISPLAY_DVC_INFO_EX set = {};
                set.version = NV_DISPLAY_DVC_INFO_EX_VER;
                set.currentLevel = target;
                if (s_NvAPI_GPU_SetDVCLevelEx(gpus[g], outId, &set) == 0) ok = true;
            } else {
                // Blind set — common for primary display
                NV_DISPLAY_DVC_INFO_EX set = {};
                set.version = NV_DISPLAY_DVC_INFO_EX_VER;
                set.currentLevel = vib;
                if (s_NvAPI_GPU_SetDVCLevelEx(gpus[g], outId, &set) == 0) ok = true;
            }
        }
    }
    return ok;
#else
    (void)percentage; return false;
#endif
}

bool GpuController::ApplyMagnificationEffect(const DisplaySettings& settings) {
#ifdef _WIN32
    // ----- Saturation matrix (Digital Vibrance) -----
    float vib = (float)std::clamp(settings.digitalVibrance, 0, 100) / 100.0f;
    float sat = 1.0f + vib * 2.0f;   // 0%->1.0 (identity), 100%->3.0
    float inv = (1.0f - sat) / 3.0f;

    float c = std::max(0.1f, settings.contrast);
    float bright = settings.brightnessOffset;

    float rr = (inv + sat) * settings.rgbRed   * c;
    float rg = inv         * settings.rgbGreen * c;
    float rb = inv         * settings.rgbBlue  * c;
    float gr = inv         * settings.rgbRed   * c;
    float gg = (inv + sat) * settings.rgbGreen * c;
    float gb = inv         * settings.rgbBlue  * c;
    float br = inv         * settings.rgbRed   * c;
    float bg = inv         * settings.rgbGreen * c;
    float bb = (inv + sat) * settings.rgbBlue  * c;

    // ----- MSAA blend: lerp the matrix towards identity -----
    // When msaaStrength > 0, off-diagonal elements (cross-channel leakage) are boosted
    // slightly which softens hard edges in a way analogous to subpixel blending.
    float msaa = std::clamp(settings.msaaStrength, 0.0f, 1.0f);
    if (msaa > 0.001f) {
        float blend = msaa * 0.18f; // subtle – too much looks blurry
        // Diagonal stays, off-diagonals move toward each other (FXAA-like)
        rr = rr * (1.0f - blend) + (rr + rg + rb) / 3.0f * blend;
        gg = gg * (1.0f - blend) + (gr + gg + gb) / 3.0f * blend;
        bb = bb * (1.0f - blend) + (br + bg + bb) / 3.0f * blend;
    }

    MAGCOLOREFFECT eff = {};
    eff.transform[0][0] = rr; eff.transform[0][1] = rg; eff.transform[0][2] = rb;
    eff.transform[1][0] = gr; eff.transform[1][1] = gg; eff.transform[1][2] = gb;
    eff.transform[2][0] = br; eff.transform[2][1] = bg; eff.transform[2][2] = bb;
    eff.transform[3][3] = 1.0f;
    eff.transform[4][0] = bright; eff.transform[4][1] = bright; eff.transform[4][2] = bright; eff.transform[4][4] = 1.0f;

    {
        std::lock_guard<std::mutex> lk(s_magMutex);
        s_magCurrentEffect = eff;
    }
    s_magPending.store(true);
    return true;
#else
    (void)settings; return true;
#endif
}


bool GpuController::ApplySettings(const DisplaySettings& settings, int monitorIndex) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_currentSettings = settings;

    bool gdiOk = ApplyGdiGammaRamp(settings, monitorIndex);
    bool nvOk  = false;
    if (m_nvapiInitialized) {
        nvOk = ApplyNvapiVibrance(settings.digitalVibrance, monitorIndex);
    }
    // Always apply Magnification for saturation (works on all GPUs, all games, all resolutions)
    ApplyMagnificationEffect(settings);

    return (gdiOk || nvOk);
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
    s.brightnessOffset = std::clamp(brightnessOffset, -0.5f, 0.5f);
    return ApplySettings(s, monitorIndex);
}

bool GpuController::SetContrast(float contrast, int monitorIndex) {
    DisplaySettings s = GetCurrentSettings();
    s.contrast = std::clamp(contrast, 0.5f, 2.5f);
    return ApplySettings(s, monitorIndex);
}

bool GpuController::SetRgbChannels(float red, float green, float blue, int monitorIndex) {
    DisplaySettings s = GetCurrentSettings();
    s.rgbRed   = std::clamp(red,   0.5f, 2.0f);
    s.rgbGreen = std::clamp(green, 0.5f, 2.0f);
    s.rgbBlue  = std::clamp(blue,  0.5f, 2.0f);
    return ApplySettings(s, monitorIndex);
}

bool GpuController::SetSharpness(float sharpness, int monitorIndex) {
    DisplaySettings s = GetCurrentSettings();
    s.sharpness = std::clamp(sharpness, 0.0f, 1.0f);
    return ApplySettings(s, monitorIndex);
}

bool GpuController::ResetToDefault(int monitorIndex) {
#ifdef _WIN32
    // Reset Magnification to identity
    {
        std::lock_guard<std::mutex> ml(s_magMutex);
        s_magCurrentEffect = MakeIdentityEffect();
    }
    s_magPending.store(true);
#endif

    DisplaySettings def;
    return ApplySettings(def, monitorIndex);
}

bool GpuController::ApplyGdiGammaRamp(const DisplaySettings& settings, int monitorIndex) {
#ifdef _WIN32
    WORD ramp[3][256];

    float gamma       = std::max(0.1f, settings.gamma);
    float contrast    = std::max(0.1f, settings.contrast);
    float bright      = settings.brightnessOffset;
    float sharpness   = std::clamp(settings.sharpness, 0.0f, 1.0f);
    float shadowDetail = std::clamp(settings.shadowDetail, 0.0f, 1.0f);

    // Color Temperature: Kelvin -> RGB multipliers
    float tempK = std::clamp(settings.colorTemperature, 2700.0f, 10000.0f);
    float tempR = 1.0f, tempG = 1.0f, tempB = 1.0f;
    {
        float temp = tempK / 100.0f;
        if (temp <= 66.0f) tempR = 1.0f;
        else tempR = 1.292936186f * std::pow(temp - 60.0f, -0.1332047592f);

        if (temp <= 66.0f) tempG = 0.3900815788f * std::log(temp) - 0.6318414438f;
        else               tempG = 1.129890861f  * std::pow(temp - 60.0f, -0.0755148492f);

        if (temp >= 66.0f)       tempB = 1.0f;
        else if (temp <= 19.0f) tempB = 0.0f;
        else                    tempB = 0.5432067891f * std::log(temp - 10.0f) - 1.19625408f;

        // Normalize to 6500K identity
        float t65 = 65.0f;
        float n6500G = 0.3900815788f * std::log(t65) - 0.6318414438f;
        float n6500B = 0.5432067891f * std::log(t65 - 10.0f) - 1.19625408f;
        tempR = std::clamp(tempR,                          0.5f, 1.5f);
        tempG = std::clamp(tempG / std::max(0.001f, n6500G), 0.5f, 1.5f);
        tempB = std::clamp(tempB / std::max(0.001f, n6500B), 0.5f, 1.5f);
    }

    for (int i = 0; i < 256; ++i) {
        float normalized = (float)i / 255.0f;

        // 1. Gamma
        float gVal = std::pow(normalized, 1.0f / gamma);

        // 2. Shadow detail toe curve
        if (shadowDetail > 0.001f) {
            float toe  = 0.20f;
            float lift = shadowDetail * 0.25f;
            if (gVal < toe) {
                float t = gVal / toe;
                gVal += lift * (1.0f - t * t) * toe;
            } else if (gVal < toe * 2.0f) {
                float blend = (gVal - toe) / toe;
                gVal += lift * (1.0f - blend) * 0.3f * toe;
            }
        }

        // 3. CAS sharpening S-curve
        if (sharpness > 0.001f) {
            float mid = 0.5f;
            float d   = gVal - mid;
            float sc  = sharpness * 0.35f;
            float sCurve = mid + d * (1.0f + sc * (1.0f - std::abs(d) * 2.0f));
            float localG = std::sin(normalized * 3.14159265f);
            float edge   = sharpness * 0.20f * localG * (1.0f - std::abs(d) * 1.5f);
            gVal = std::clamp(sCurve + edge, 0.0f, 1.0f);
        }

        // 4. Contrast & brightness
        float cVal = (gVal - 0.5f) * contrast + 0.5f + bright;

        // 5. RGB channels + color temp
        float rVal = cVal * settings.rgbRed   * tempR;
        float gChannelVal = cVal * settings.rgbGreen * tempG;
        float bVal = cVal * settings.rgbBlue  * tempB;

        ramp[0][i] = (WORD)std::clamp(rVal * 65535.0f,         0.0f, 65535.0f);
        ramp[1][i] = (WORD)std::clamp(gChannelVal * 65535.0f,  0.0f, 65535.0f);
        ramp[2][i] = (WORD)std::clamp(bVal * 65535.0f,         0.0f, 65535.0f);
    }

    bool anySuccess = false;

    // Primary desktop DC
    HDC hdcPrimary = GetDC(NULL);
    if (hdcPrimary) {
        if (SetDeviceGammaRamp(hdcPrimary, ramp)) anySuccess = true;
        ReleaseDC(NULL, hdcPrimary);
    }

    // All enumerated displays
    DISPLAY_DEVICEA dd; dd.cb = sizeof(dd);
    for (int dev = 0; EnumDisplayDevicesA(NULL, dev, &dd, 0); ++dev) {
        if (dd.StateFlags & DISPLAY_DEVICE_ATTACHED_TO_DESKTOP) {
            if (monitorIndex == -1 || monitorIndex == dev) {
                HDC mDC = CreateDCA(dd.DeviceName, NULL, NULL, NULL);
                if (mDC) {
                    if (SetDeviceGammaRamp(mDC, ramp)) anySuccess = true;
                    DeleteDC(mDC);
                }
            }
        }
    }

    return anySuccess;
#else
    (void)settings; (void)monitorIndex; return true;
#endif
}

} // namespace dustfx
