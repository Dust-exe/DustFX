#pragma once

#include "core/common.h"
#include <mutex>
#include <vector>

namespace dustfx {

class GpuController {
public:
    static GpuController& Instance();

    bool Initialize();
    void Shutdown();

    // Display Control
    bool ApplySettings(const DisplaySettings& settings, int monitorIndex = -1);
    bool SetGamma(float gamma, int monitorIndex = -1);
    bool SetDigitalVibrance(int percentage, int monitorIndex = -1);
    bool SetBrightness(float brightnessOffset, int monitorIndex = -1);
    bool SetContrast(float contrast, int monitorIndex = -1);
    bool SetRgbChannels(float red, float green, float blue, int monitorIndex = -1);
    bool SetSharpness(float sharpness, int monitorIndex = -1);
    bool ResetToDefault(int monitorIndex = -1);

    // Getters
    GpuVendor GetVendor() const { return m_vendor; }
    std::string GetVendorName() const;
    DisplaySettings GetCurrentSettings() const;

private:
    GpuController();
    ~GpuController();

    void DetectVendor();
    bool ApplyGdiGammaRamp(const DisplaySettings& settings, int monitorIndex);
    bool ApplyNvidiaVibrance(int percentage, int monitorIndex);
    bool ApplyAmdSaturation(int percentage, int monitorIndex);

    mutable std::mutex m_mutex;
    GpuVendor m_vendor = GpuVendor::GENERIC;
    DisplaySettings m_currentSettings;
    bool m_initialized = false;
};

} // namespace dustfx
