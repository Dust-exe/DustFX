#pragma once

#include "core/common.h"
#include <string>
#include <functional>
#include <thread>
#include <atomic>
#include <chrono>

namespace dustfx {

using UpdateCheckCallback = std::function<void(bool updateAvailable, const ReleaseInfo& info)>;

class AutoUpdater {
public:
    static AutoUpdater& Instance();

    void Configure(
        const std::string& owner = "Dust-exe",
        const std::string& repo = "DustFX",
        const std::string& currentVersion = DUSTFX_VERSION_STRING
    );

    // One-shot manual check
    bool CheckForUpdate(ReleaseInfo& outInfo);

    // Background periodic checker
    void StartBackgroundChecker(
        UpdateCheckCallback callback,
        std::chrono::minutes interval = std::chrono::minutes(10)
    );
    void StopBackgroundChecker();

    std::string GetCurrentVersion() const { return m_currentVersion; }
    static bool IsNewerVersion(const std::string& current, const std::string& remote);

    // Real update: download and apply
    bool DownloadUpdate(const ReleaseInfo& info, const std::string& savePath);
    bool ApplyUpdate(const std::string& downloadedExePath);

private:
    AutoUpdater();
    ~AutoUpdater();

    void BackgroundLoop();
    std::string FetchLatestRelease();

    std::string m_owner = "Dust-exe";
    std::string m_repo = "DustFX";
    std::string m_currentVersion = DUSTFX_VERSION_STRING;

    UpdateCheckCallback m_callback;
    std::chrono::minutes m_checkInterval{10};
    std::thread m_bgThread;
    std::atomic<bool> m_running{false};
};

} // namespace dustfx
