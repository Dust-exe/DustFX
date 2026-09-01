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

static size_t DownloadWriteCallback(void* contents, size_t size, size_t nmemb, void* userp) {
    size_t total = size * nmemb;
    std::ofstream* out = static_cast<std::ofstream*>(userp);
    out->write(static_cast<const char*>(contents), total);
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

        if (j.contains("assets") && j["assets"].is_array() && !j["assets"].empty()) {
            // Fallback: first asset
            outInfo.downloadUrl = j["assets"][0].value("browser_download_url", "");
            int bestPriority = 3;

            for (const auto& asset : j["assets"]) {
                std::string name = asset.value("name", "");

                // First priority: look specifically for "DustFX_Setup.exe" or "Setup.exe"
                if (name.find("Setup.exe") != std::string::npos ||
                    name.find("setup.exe") != std::string::npos ||
                    name.find("Setup") != std::string::npos ||
                    name.find("Installer") != std::string::npos) {
                    outInfo.downloadUrl = asset.value("browser_download_url", "");
                    bestPriority = 1;
                    break;
                }

                // Second priority: look for any .exe
                if (bestPriority > 2 && name.find(".exe") != std::string::npos) {
                    outInfo.downloadUrl = asset.value("browser_download_url", "");
                    bestPriority = 2;
                }
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

#ifdef _WIN32
#include <urlmon.h>

// Helper to run a command securely via CreateProcess to avoid cmd.exe injection vulnerabilities
static int RunCommand(const std::string& cmdLine) {
    STARTUPINFOA si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    si.dwFlags = STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_HIDE; // Hide console window
    ZeroMemory(&pi, sizeof(pi));

    // Create a mutable copy of the command line as CreateProcessA may modify it
    std::vector<char> cmdBuffer(cmdLine.begin(), cmdLine.end());
    cmdBuffer.push_back('\0');

    if (!CreateProcessA(NULL, cmdBuffer.data(), NULL, NULL, FALSE, CREATE_NO_WINDOW, NULL, NULL, &si, &pi)) {
        return -1;
    }

    WaitForSingleObject(pi.hProcess, INFINITE);
    DWORD exitCode = 1;
    GetExitCodeProcess(pi.hProcess, &exitCode);

    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);

    return static_cast<int>(exitCode);
}

// Helper to escape single quotes for PowerShell
static std::string EscapePowerShell(const std::string& input) {
    std::string output;
    for (char c : input) {
        if (c == '\'') {
            output += "''"; // Escape single quote in PowerShell
        } else {
            output += c;
        }
    }
    return output;
}

// Helper to escape double quotes for curl.exe
static std::string EscapeDoubleQuotes(const std::string& input) {
    std::string output;
    for (char c : input) {
        if (c == '\"') {
            output += "\\\"";
        } else {
            output += c;
        }
    }
    return output;
}

// Helper to base64 encode data for PowerShell -EncodedCommand
static std::string Base64Encode(const unsigned char* data, size_t len) {
    static const char lookup[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    std::string out;
    out.reserve(((len + 2) / 3) * 4);
    int val = 0;
    int valb = -6;
    for (size_t i = 0; i < len; i++) {
        val = (val << 8) + data[i];
        valb += 8;
        while (valb >= 0) {
            out.push_back(lookup[(val >> valb) & 0x3F]);
            valb -= 6;
        }
    }
    if (valb > -6) {
        out.push_back(lookup[((val << 8) >> (valb + 8)) & 0x3F]);
    }
    while (out.size() % 4) {
        out.push_back('=');
    }
    return out;
}
#endif

bool AutoUpdater::DownloadUpdate(const ReleaseInfo& info, const std::string& savePath) {
    if (info.downloadUrl.empty()) {
        std::cerr << "[AutoUpdater] Download URL is empty." << std::endl;
        return false;
    }

    std::cout << "[AutoUpdater] Downloading update from: " << info.downloadUrl << std::endl;
    std::cout << "[AutoUpdater] Saving to: " << savePath << std::endl;

#ifdef _WIN32
    DeleteFileA(savePath.c_str());

    auto checkValidFile = [](const std::string& path) -> bool {
        std::ifstream checkFile(path, std::ios::binary | std::ios::ate);
        if (checkFile.is_open()) {
            std::streamsize sz = checkFile.tellg();
            checkFile.close();
            return (sz > 50000); // Greater than 50KB
        }
        return false;
    };

    // Tier 1: WinINet Stream with modern redirect & SSL flags
    {
        HINTERNET hInternet = InternetOpenA("DustFX-Updater/1.4", INTERNET_OPEN_TYPE_PRECONFIG, NULL, NULL, 0);
        if (hInternet) {
            DWORD flags = INTERNET_FLAG_RELOAD | INTERNET_FLAG_DONT_CACHE | INTERNET_FLAG_SECURE |
                          INTERNET_FLAG_IGNORE_REDIRECT_TO_HTTPS | INTERNET_FLAG_IGNORE_REDIRECT_TO_HTTP;
            HINTERNET hFile = InternetOpenUrlA(hInternet, info.downloadUrl.c_str(), NULL, 0, flags, 0);
            if (hFile) {
                std::ofstream out(savePath, std::ios::binary);
                if (out.is_open()) {
                    char buffer[16384];
                    DWORD bytesRead = 0;
                    while (InternetReadFile(hFile, buffer, sizeof(buffer), &bytesRead) && bytesRead > 0) {
                        out.write(buffer, bytesRead);
                    }
                    out.close();
                }
                InternetCloseHandle(hFile);
            }
            InternetCloseHandle(hInternet);
        }
        if (checkValidFile(savePath)) {
            std::cout << "[AutoUpdater] Download successful via WinINet." << std::endl;
            return true;
        }
    }

    // Tier 2: Windows 10/11 built-in curl.exe
    {
        std::string safeSavePath = EscapeDoubleQuotes(savePath);
        std::string safeUrl = EscapeDoubleQuotes(info.downloadUrl);
        std::string curlCmd = "curl.exe -f -s -S -L --connect-timeout 15 -o \"" + safeSavePath + "\" \"" + safeUrl + "\"";
        int ret = RunCommand(curlCmd);
        if (ret == 0 && checkValidFile(savePath)) {
            std::cout << "[AutoUpdater] Download successful via curl.exe." << std::endl;
            return true;
        }
    }

    // Tier 3: PowerShell WebClient with TLS 1.2
    {
        std::string safeSavePath = EscapePowerShell(savePath);
        std::string safeUrl = EscapePowerShell(info.downloadUrl);
        std::string script = "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('" + safeUrl + "', '" + safeSavePath + "')";

        std::string encodedCmd;
        int wlen = MultiByteToWideChar(CP_UTF8, 0, script.c_str(), -1, NULL, 0);
        if (wlen > 0) {
            std::vector<wchar_t> wstr(wlen);
            MultiByteToWideChar(CP_UTF8, 0, script.c_str(), -1, wstr.data(), wlen);
            // Do not include the null terminator in the base64 encoded string
            size_t dataLen = (wlen - 1) * sizeof(wchar_t);
            encodedCmd = Base64Encode(reinterpret_cast<const unsigned char*>(wstr.data()), dataLen);
        }

        std::string psCmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -EncodedCommand " + encodedCmd;
        int ret = RunCommand(psCmd);
        if (ret == 0 && checkValidFile(savePath)) {
            std::cout << "[AutoUpdater] Download successful via PowerShell." << std::endl;
            return true;
        }
    }

    // Tier 4: URLDownloadToFile fallback
    {
        HRESULT hr = URLDownloadToFileA(NULL, info.downloadUrl.c_str(), savePath.c_str(), 0, NULL);
        if (SUCCEEDED(hr) && checkValidFile(savePath)) {
            std::cout << "[AutoUpdater] Download successful via URLDownloadToFile." << std::endl;
            return true;
        }
    }

    std::cerr << "[AutoUpdater] All download tiers failed." << std::endl;
    return false;
#else
    CURL* curl = curl_easy_init();
    if (!curl) return false;

    std::ofstream out(savePath, std::ios::binary);
    if (!out.is_open()) {
        curl_easy_cleanup(curl);
        return false;
    }

    curl_easy_setopt(curl, CURLOPT_URL, info.downloadUrl.c_str());
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, DownloadWriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &out);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 60L); // Increase timeout for downloads
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);

    CURLcode res = curl_easy_perform(curl);
    long httpCode = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &httpCode);

    curl_easy_cleanup(curl);
    out.close();

    if (res != CURLE_OK || httpCode < 200 || httpCode >= 300) {
        std::remove(savePath.c_str());
        return false;
    }

    return true;
#endif
}

bool AutoUpdater::ApplyUpdate(const std::string& downloadedExePath) {
#ifdef _WIN32
    if (downloadedExePath.empty()) {
        std::cerr << "[AutoUpdater] Download path is empty." << std::endl;
        return false;
    }

    std::cout << "[AutoUpdater] Scheduled update installer launch: " << downloadedExePath << std::endl;

    // Launch installer on a detached thread after 1000ms to allow HTTP response to flush cleanly to browser
    std::thread([downloadedExePath]() {
        std::this_thread::sleep_for(std::chrono::milliseconds(1000));
        
        // Launch installer with runas to prompt for UAC if needed
        // Do NOT use /S (silent) - it blocks UAC elevation and fails silently
        HINSTANCE hInst = ShellExecuteA(NULL, "runas", downloadedExePath.c_str(), NULL, NULL, SW_SHOWNORMAL);
        if ((INT_PTR)hInst <= 32) {
            // Fallback: open without runas
            ShellExecuteA(NULL, "open", downloadedExePath.c_str(), NULL, NULL, SW_SHOWNORMAL);
        }
        
        // Terminate so the installer can overwrite files cleanly
        ExitProcess(0);
    }).detach();

    return true;
#else
    std::cout << "[AutoUpdater] Auto-apply not supported on this platform. Downloaded to: " << downloadedExePath << std::endl;
    return false;
#endif
}

} // namespace dustfx
