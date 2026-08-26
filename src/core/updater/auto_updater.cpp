#include "core/updater/auto_updater.h"
#include <nlohmann/json.hpp>
#include <iostream>
#include <sstream>
#include <fstream>
#include <vector>

#ifdef _WIN32
#include <windows.h>
#include <wininet.h>
#include <shellapi.h>
#else
#include "curl_compat.h"
#endif

namespace dustfx {

using json = nlohmann::json;

#ifndef _WIN32
static size_t WriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    size_t total = size * nmemb;
    static_cast<std::string*>(userp)->append(static_cast<char*>(contents), total);
    return total;
}
#endif

AutoUpdater& AutoUpdater::Instance() {
    static AutoUpdater instance;
    return instance;
}

AutoUpdater::AutoUpdater() = default;

AutoUpdater::~AutoUpdater() {
    StopBackgroundChecker();
}

void AutoUpdater::Configure(const std::string& owner, const std::string& repo, const std::string& currentVersion) {
    m_owner = owner;
    m_repo = repo;
    m_currentVersion = currentVersion;
}

std::string AutoUpdater::FetchLatestRelease() {
    std::string url = "https://api.github.com/repos/" + m_owner + "/" + m_repo + "/releases/latest";

#ifdef _WIN32
    HINTERNET hInternet = InternetOpenA("DustFX-AutoUpdater/1.1", INTERNET_OPEN_TYPE_PRECONFIG, NULL, NULL, 0);
    if (!hInternet) return "";

    DWORD flags = INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE | INTERNET_FLAG_SECURE;
    HINTERNET hFile = InternetOpenUrlA(hInternet, url.c_str(), "Accept: application/vnd.github+json\r\nX-GitHub-Api-Version: 2022-11-28", -1, flags, 0);
    if (!hFile) {
        InternetCloseHandle(hInternet);
        return "";
    }

    std::string response;
    char buffer[4096];
    DWORD bytesRead = 0;
    while (InternetReadFile(hFile, buffer, sizeof(buffer), &bytesRead) && bytesRead > 0) {
        response.append(buffer, bytesRead);
    }

    InternetCloseHandle(hFile);
    InternetCloseHandle(hInternet);
    return response;
#else
    CURL* curl = curl_easy_init();
    if (!curl) return "";

    std::string response;

    struct curl_slist* headers = nullptr;
    headers = curl_slist_append(headers, "Accept: application/vnd.github+json");
    headers = curl_slist_append(headers, "User-Agent: DustFX-AutoUpdater/1.1");
    headers = curl_slist_append(headers, "X-GitHub-Api-Version: 2022-11-28");

    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 15L);
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);

    CURLcode res = curl_easy_perform(curl);
    long httpCode = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &httpCode);

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    if (res != CURLE_OK || httpCode != 200) {
        return "";
    }

    return response;
#endif
}

bool AutoUpdater::CheckForUpdate(ReleaseInfo& outInfo) {
    std::string responseStr = FetchLatestRelease();
    if (responseStr.empty()) {
        return false;
    }

    try {
        json j = json::parse(responseStr);

        outInfo.tagName = j.value("tag_name", "");
        outInfo.htmlUrl = j.value("html_url", "");
        outInfo.releaseNotes = j.value("body", "");
        outInfo.publishedAt = j.value("published_at", "");

        outInfo.version = outInfo.tagName;
        if (!outInfo.version.empty() && outInfo.version[0] == 'v') {
            outInfo.version = outInfo.version.substr(1);
        }

        if (j.contains("assets") && j["assets"].is_array()) {
            for (const auto& asset : j["assets"]) {
                std::string name = asset.value("name", "");
                if (name.find(".exe") != std::string::npos ||
                    name.find("DustFX") != std::string::npos ||
                    name.find("Dust") != std::string::npos) {
                    outInfo.downloadUrl = asset.value("browser_download_url", "");
                    break;
                }
            }
            if (outInfo.downloadUrl.empty() && !j["assets"].empty()) {
                outInfo.downloadUrl = j["assets"][0].value("browser_download_url", "");
            }
        }

        outInfo.isNewer = IsNewerVersion(m_currentVersion, outInfo.version);

        if (outInfo.isNewer) {
            std::cout << "[AutoUpdater] 🔔 Yeni sürüm bulundu: v" << outInfo.version
                      << " (Mevcut: v" << m_currentVersion << ")" << std::endl;
            std::cout << "[AutoUpdater] İndirme Bağlantısı: " << outInfo.downloadUrl << std::endl;
        } else {
            std::cout << "[AutoUpdater] ✓ Uygulama güncel (v" << m_currentVersion << ")" << std::endl;
        }

        return outInfo.isNewer;
    } catch (const std::exception& e) {
        std::cerr << "[AutoUpdater] JSON Ayrıştırma Hatası: " << e.what() << std::endl;
        return false;
    }
}

bool AutoUpdater::IsNewerVersion(const std::string& current, const std::string& remote) {
    if (remote.empty() || current.empty()) return false;

    auto parseSemver = [](const std::string& v) -> std::vector<int> {
        std::vector<int> parts;
        std::istringstream ss(v);
        std::string segment;
        while (std::getline(ss, segment, '.')) {
            try {
                parts.push_back(std::stoi(segment));
            } catch (...) {
                parts.push_back(0);
            }
        }
        while (parts.size() < 3) parts.push_back(0);
        return parts;
    };

    auto curParts = parseSemver(current);
    auto remParts = parseSemver(remote);

    for (size_t i = 0; i < 3; ++i) {
        if (remParts[i] > curParts[i]) return true;
        if (remParts[i] < curParts[i]) return false;
    }
    return false;
}

void AutoUpdater::StartBackgroundChecker(UpdateCheckCallback callback, std::chrono::minutes interval) {
    if (m_running.load()) return;

    m_callback = std::move(callback);
    m_checkInterval = interval;
    m_running.store(true);
    m_bgThread = std::thread(&AutoUpdater::BackgroundLoop, this);

    std::cout << "[AutoUpdater] GitHub güncelleme izleyicisi başlatıldı ("
              << interval.count() << " dakikada bir kontrol ediliyor)." << std::endl;
}

void AutoUpdater::StopBackgroundChecker() {
    if (m_running.load()) {
        m_running.store(false);
        if (m_bgThread.joinable()) {
            m_bgThread.join();
        }
    }
}

void AutoUpdater::BackgroundLoop() {
    // Initial check delay (5 sec)
    for (int i = 0; i < 50 && m_running.load(); ++i) {
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }

    while (m_running.load()) {
        ReleaseInfo info;
        bool hasUpdate = CheckForUpdate(info);

        if (m_callback) {
            m_callback(hasUpdate, info);
        }

        auto sleepEnd = std::chrono::steady_clock::now() + m_checkInterval;
        while (m_running.load() && std::chrono::steady_clock::now() < sleepEnd) {
            std::this_thread::sleep_for(std::chrono::seconds(5));
        }
    }
}

bool AutoUpdater::DownloadUpdate(const ReleaseInfo& info, const std::string& savePath) {
    if (info.downloadUrl.empty()) {
        std::cerr << "[AutoUpdater] Download URL is empty." << std::endl;
        return false;
    }

    std::cout << "[AutoUpdater] Downloading update from: " << info.downloadUrl << std::endl;
    std::cout << "[AutoUpdater] Saving to: " << savePath << std::endl;

#ifdef _WIN32
    HINTERNET hInternet = InternetOpenA("DustFX-Updater/1.2", INTERNET_OPEN_TYPE_PRECONFIG, NULL, NULL, 0);
    if (!hInternet) {
        std::cerr << "[AutoUpdater] InternetOpen failed." << std::endl;
        return false;
    }

    DWORD flags = INTERNET_FLAG_RELOAD | INTERNET_FLAG_NO_CACHE_WRITE | INTERNET_FLAG_SECURE;
    HINTERNET hFile = InternetOpenUrlA(hInternet, info.downloadUrl.c_str(), NULL, 0, flags, 0);
    if (!hFile) {
        InternetCloseHandle(hInternet);
        std::cerr << "[AutoUpdater] InternetOpenUrl failed for download." << std::endl;
        return false;
    }

    std::ofstream outFile(savePath, std::ios::binary);
    if (!outFile.is_open()) {
        InternetCloseHandle(hFile);
        InternetCloseHandle(hInternet);
        std::cerr << "[AutoUpdater] Cannot open output file: " << savePath << std::endl;
        return false;
    }

    char buffer[8192];
    DWORD bytesRead = 0;
    DWORD totalBytes = 0;
    while (InternetReadFile(hFile, buffer, sizeof(buffer), &bytesRead) && bytesRead > 0) {
        outFile.write(buffer, bytesRead);
        totalBytes += bytesRead;
    }

    outFile.close();
    InternetCloseHandle(hFile);
    InternetCloseHandle(hInternet);

    std::cout << "[AutoUpdater] Download complete: " << totalBytes << " bytes." << std::endl;
    return (totalBytes > 0);
#else
    // Linux/Mac fallback using curl CLI
    std::string cmd = "curl -L -o '" + savePath + "' '" + info.downloadUrl + "' 2>/dev/null";
    int ret = system(cmd.c_str());
    return (ret == 0);
#endif
}

bool AutoUpdater::ApplyUpdate(const std::string& downloadedExePath) {
#ifdef _WIN32
    // Get current executable path
    char currentExePath[MAX_PATH];
    GetModuleFileNameA(NULL, currentExePath, MAX_PATH);

    // Get temp directory for the update script
    char tmpDir[MAX_PATH];
    GetTempPathA(MAX_PATH, tmpDir);
    std::string batPath = std::string(tmpDir) + "dustfx_update.bat";

    // Create self-replacing batch script
    std::ofstream bat(batPath);
    if (!bat.is_open()) {
        std::cerr << "[AutoUpdater] Cannot create update batch script." << std::endl;
        return false;
    }

    bat << "@echo off\r\n";
    bat << "echo DustFX Guncelleme baslatiliyor...\r\n";
    bat << "echo Mevcut DustFX kapatiliyor...\r\n";
    bat << "timeout /t 2 /nobreak >nul\r\n";
    bat << "taskkill /F /IM DustFX.exe /T >nul 2>&1\r\n";
    bat << "timeout /t 1 /nobreak >nul\r\n";
    bat << "echo Eski dosyalar siliniyor...\r\n";
    bat << "del /f /q \"" << currentExePath << "\" >nul 2>&1\r\n";
    bat << "timeout /t 1 /nobreak >nul\r\n";
    bat << "echo Yeni dosyalar kopyalaniyor...\r\n";
    bat << "copy /y \"" << downloadedExePath << "\" \"" << currentExePath << "\" >nul\r\n";
    bat << "echo Guncelleme tamamlandi! DustFX yeniden baslatiliyor...\r\n";
    bat << "timeout /t 1 /nobreak >nul\r\n";
    bat << "start \"\" \"" << currentExePath << "\"\r\n";
    bat << "del /f /q \"" << downloadedExePath << "\" >nul 2>&1\r\n";
    bat << "del /f /q \"%~f0\" >nul 2>&1\r\n";
    bat.close();

    std::cout << "[AutoUpdater] Update script created: " << batPath << std::endl;
    std::cout << "[AutoUpdater] Launching updater and exiting current process..." << std::endl;

    // Launch the batch script hidden
    ShellExecuteA(NULL, "open", batPath.c_str(), NULL, NULL, SW_HIDE);

    // Exit current process so files can be replaced
    ExitProcess(0);
    return true; // never reached
#else
    std::cout << "[AutoUpdater] Auto-apply not supported on this platform. Downloaded to: " << downloadedExePath << std::endl;
    return false;
#endif
}

} // namespace dustfx
