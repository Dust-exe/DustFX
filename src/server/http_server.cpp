#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <shellapi.h>
typedef int socklen_t;
#endif

#include "server/http_server.h"
#include "core/gpu/gpu_controller.h"
#include "core/profile/profile_manager.h"
#include "core/config/settings_manager.h"
#include "core/display/monitor_manager.h"
#include "core/process/process_watcher.h"
#include "core/hotkey/hotkey_manager.h"
#include "core/updater/auto_updater.h"
#include "overlay/overlay_toast.h"

#include <nlohmann/json.hpp>
#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <cstring>
#include <filesystem>

#ifndef _WIN32
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#define closesocket close
#define INVALID_SOCKET (-1)
#define SOCKET_ERROR (-1)
#endif

namespace dustfx {

using json = nlohmann::json;

HttpServer& HttpServer::Instance() {
    static HttpServer instance;
    return instance;
}

HttpServer::HttpServer() = default;

HttpServer::~HttpServer() {
    Stop();
}

bool HttpServer::Start(int port, const std::string& webRoot) {
    if (m_running.load()) return true;

    m_port = port;
    m_webRoot = webRoot;

#ifdef _WIN32
    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);
#endif

    m_serverSocket = socket(AF_INET, SOCK_STREAM, 0);
    if (m_serverSocket == static_cast<uintptr_t>(INVALID_SOCKET)) {
        std::cerr << "[HttpServer] Failed to create socket." << std::endl;
        return false;
    }

    int opt = 1;
#ifdef _WIN32
    setsockopt(m_serverSocket, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));
#else
    setsockopt(m_serverSocket, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
#endif

    sockaddr_in address{};
    address.sin_family = AF_INET;
    address.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    address.sin_port = htons(m_port);

    if (bind(m_serverSocket, (struct sockaddr*)&address, sizeof(address)) == SOCKET_ERROR) {
        std::cerr << "[HttpServer] Bind failed on port " << m_port << std::endl;
        closesocket(m_serverSocket);
        return false;
    }

    if (listen(m_serverSocket, 10) == SOCKET_ERROR) {
        std::cerr << "[HttpServer] Listen failed." << std::endl;
        closesocket(m_serverSocket);
        return false;
    }

    m_running.store(true);
    m_serverThread = std::thread(&HttpServer::ServerLoop, this);

    std::cout << "[HttpServer] DustFX UI server listening on http://127.0.0.1:" << m_port << std::endl;
    return true;
}

void HttpServer::Stop() {
    if (m_running.load()) {
        m_running.store(false);
        if (m_serverSocket != static_cast<uintptr_t>(INVALID_SOCKET)) {
            closesocket(m_serverSocket);
            m_serverSocket = INVALID_SOCKET;
        }
        if (m_serverThread.joinable()) {
            m_serverThread.join();
        }
#ifdef _WIN32
        WSACleanup();
#endif
    }
}

void HttpServer::ServerLoop() {
    while (m_running.load()) {
        sockaddr_in clientAddr{};
        socklen_t clientLen = sizeof(clientAddr);

        uintptr_t clientSock = accept(m_serverSocket, (struct sockaddr*)&clientAddr, &clientLen);
        if (clientSock == static_cast<uintptr_t>(INVALID_SOCKET)) {
            if (!m_running.load()) break;
            continue;
        }

        std::thread([this, clientSock]() {
            HandleClient(static_cast<int>(clientSock));
        }).detach();
    }
}

void HttpServer::HandleClient(int clientSocket) {
    std::string req;
    char buffer[8192];
    int bytesRead = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
    if (bytesRead <= 0) {
        closesocket(clientSocket);
        return;
    }

    buffer[bytesRead] = '\0';
    req.append(buffer, bytesRead);

    // Check for Content-Length to read entire body
    size_t headerEnd = req.find("\r\n\r\n");
    if (headerEnd != std::string::npos) {
        size_t clPos = req.find("Content-Length:");
        if (clPos == std::string::npos) clPos = req.find("content-length:");
        if (clPos != std::string::npos && clPos < headerEnd) {
            size_t valStart = clPos + 15;
            size_t valEnd = req.find("\r\n", valStart);
            if (valEnd != std::string::npos) {
                try {
                    int contentLength = std::stoi(req.substr(valStart, valEnd - valStart));
                    size_t bodyRead = req.length() - (headerEnd + 4);
                    while (bodyRead < static_cast<size_t>(contentLength)) {
                        int moreBytes = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
                        if (moreBytes <= 0) break;
                        req.append(buffer, moreBytes);
                        bodyRead += moreBytes;
                    }
                } catch (...) {}
            }
        }
    }

    std::istringstream stream(req);
    std::string method, path, protocol;
    stream >> method >> path >> protocol;

    // Extract body
    std::string body;
    headerEnd = req.find("\r\n\r\n");
    if (headerEnd != std::string::npos) {
        body = req.substr(headerEnd + 4);
    }

    std::string response = ProcessRequest(method, path, body);
    send(clientSocket, response.c_str(), static_cast<int>(response.length()), 0);
    closesocket(clientSocket);
}

static std::string MakeHttpResponse(int code, const std::string& status, const std::string& contentType, const std::string& body) {
    std::stringstream ss;
    ss << "HTTP/1.1 " << code << " " << status << "\r\n";
    ss << "Content-Type: " << contentType << "; charset=utf-8\r\n";
    ss << "Content-Length: " << body.length() << "\r\n";
    ss << "Access-Control-Allow-Origin: *\r\n";
    ss << "Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS\r\n";
    ss << "Access-Control-Allow-Headers: Content-Type\r\n";
    ss << "Connection: close\r\n\r\n";
    ss << body;
    return ss.str();
}

std::string HttpServer::ProcessRequest(const std::string& method, const std::string& path, const std::string& body) {
    if (method == "OPTIONS") {
        return MakeHttpResponse(200, "OK", "text/plain", "");
    }

    // 1. GET /api/status
    if (path == "/api/status" && method == "GET") {
        DisplaySettings s = GpuController::Instance().GetCurrentSettings();
        auto monitors = MonitorManager::Instance().GetMonitors();
        
        json jMonitors = json::array();
        for (const auto& m : monitors) {
            jMonitors.push_back({
                {"index", m.index},
                {"name", m.name},
                {"displayName", m.displayName},
                {"isPrimary", m.isPrimary},
                {"width", m.width},
                {"height", m.height},
                {"refreshRate", m.refreshRate}
            });
        }

        json res = {
            {"status", "online"},
            {"version", DUSTFX_VERSION_STRING},
            {"gpuVendor", GpuController::Instance().GetVendorName()},
            {"activeProfileId", ProfileManager::Instance().GetActiveProfileId()},
            {"targetMonitorIndex", SettingsManager::Instance().GetTargetMonitorIndex()},
            {"currentSettings", {
                {"gamma", s.gamma},
                {"digitalVibrance", s.digitalVibrance},
                {"brightnessOffset", s.brightnessOffset},
                {"contrast", s.contrast},
                {"rgbRed", s.rgbRed},
                {"rgbGreen", s.rgbGreen},
                {"rgbBlue", s.rgbBlue},
                {"sharpness", s.sharpness},
                {"colorTemperature", s.colorTemperature},
                {"shadowDetail", s.shadowDetail},
                {"msaaStrength", s.msaaStrength},
                {"edgeEnhance", s.edgeEnhance},
                {"bloom", s.bloom},
                {"crosshairEnabled", s.crosshairEnabled},
                {"crosshairStyle", s.crosshairStyle},
                {"crosshairColor", s.crosshairColor},
                {"crosshairSize", s.crosshairSize},
                {"crosshairThickness", s.crosshairThickness},
                {"crosshairGap", s.crosshairGap},
                {"crosshairDotSize", s.crosshairDotSize},
                {"crosshairOutline", s.crosshairOutline},
                {"crosshairOpacity", s.crosshairOpacity},
                {"sniperZoomEnabled", s.sniperZoomEnabled},
                {"sniperZoomScale", s.sniperZoomScale},
                {"sniperZoomSize", s.sniperZoomSize},
                {"sniperZoomShape", s.sniperZoomShape},
                {"sniperZoomMode", s.sniperZoomMode},
                {"sniperZoomBorderColor", s.sniperZoomBorderColor},
                {"sniperZoomBorderWidth", s.sniperZoomBorderWidth},
                {"sniperZoomShowDot", s.sniperZoomShowDot}
            }},
            {"monitors", jMonitors}
        };
        return MakeHttpResponse(200, "OK", "application/json", res.dump());
    }

    // 2. POST /api/apply
    if (path == "/api/apply" && method == "POST") {
        try {
            json j = json::parse(body);
            DisplaySettings s = GpuController::Instance().GetCurrentSettings();
            
            bool displayChanged = false;

            if (j.contains("gamma")) { s.gamma = j["gamma"].get<float>(); displayChanged = true; }
            if (j.contains("digitalVibrance")) { s.digitalVibrance = j["digitalVibrance"].get<int>(); displayChanged = true; }
            if (j.contains("brightnessOffset")) { s.brightnessOffset = j["brightnessOffset"].get<float>(); displayChanged = true; }
            if (j.contains("contrast")) { s.contrast = j["contrast"].get<float>(); displayChanged = true; }
            if (j.contains("rgbRed")) { s.rgbRed = j["rgbRed"].get<float>(); displayChanged = true; }
            if (j.contains("rgbGreen")) { s.rgbGreen = j["rgbGreen"].get<float>(); displayChanged = true; }
            if (j.contains("rgbBlue")) { s.rgbBlue = j["rgbBlue"].get<float>(); displayChanged = true; }
            if (j.contains("sharpness")) { s.sharpness = j["sharpness"].get<float>(); displayChanged = true; }
            if (j.contains("colorTemperature")) { s.colorTemperature = j["colorTemperature"].get<float>(); displayChanged = true; }
            if (j.contains("shadowDetail")) { s.shadowDetail = j["shadowDetail"].get<float>(); displayChanged = true; }
            if (j.contains("msaaStrength")) { s.msaaStrength = j["msaaStrength"].get<float>(); displayChanged = true; }
            if (j.contains("edgeEnhance")) { s.edgeEnhance = j["edgeEnhance"].get<float>(); displayChanged = true; }
            if (j.contains("bloom")) { s.bloom = j["bloom"].get<float>(); displayChanged = true; }

            if (j.contains("crosshairEnabled")) s.crosshairEnabled = j["crosshairEnabled"].get<bool>();
            if (j.contains("crosshairStyle")) s.crosshairStyle = j["crosshairStyle"].get<std::string>();
            if (j.contains("crosshairColor")) s.crosshairColor = j["crosshairColor"].get<std::string>();
            if (j.contains("crosshairSize")) s.crosshairSize = j["crosshairSize"].get<int>();
            if (j.contains("crosshairThickness")) s.crosshairThickness = j["crosshairThickness"].get<int>();
            if (j.contains("crosshairGap")) s.crosshairGap = j["crosshairGap"].get<int>();
            if (j.contains("crosshairDotSize")) s.crosshairDotSize = j["crosshairDotSize"].get<int>();
            if (j.contains("crosshairOutline")) s.crosshairOutline = j["crosshairOutline"].get<int>();
            if (j.contains("crosshairOpacity")) s.crosshairOpacity = j["crosshairOpacity"].get<float>();
            if (j.contains("sniperZoomEnabled")) s.sniperZoomEnabled = j["sniperZoomEnabled"].get<bool>();
            if (j.contains("sniperZoomScale")) s.sniperZoomScale = j["sniperZoomScale"].get<float>();
            if (j.contains("sniperZoomSize")) s.sniperZoomSize = j["sniperZoomSize"].get<int>();
            if (j.contains("sniperZoomShape")) s.sniperZoomShape = j["sniperZoomShape"].get<std::string>();
            if (j.contains("sniperZoomMode")) s.sniperZoomMode = j["sniperZoomMode"].get<std::string>();
            if (j.contains("sniperZoomBorderColor")) s.sniperZoomBorderColor = j["sniperZoomBorderColor"].get<std::string>();
            if (j.contains("sniperZoomBorderWidth")) s.sniperZoomBorderWidth = j["sniperZoomBorderWidth"].get<int>();
            if (j.contains("sniperZoomShowDot")) s.sniperZoomShowDot = j["sniperZoomShowDot"].get<bool>();

            int targetMon = SettingsManager::Instance().GetTargetMonitorIndex();
            if (displayChanged) {
                GpuController::Instance().ApplySettings(s, targetMon);
            }
            SettingsManager::Instance().SetCurrentDisplaySettings(s);
            OverlayToast::Instance().UpdateCrosshair(s);
            OverlayToast::Instance().UpdateSniperZoom(s);

            return MakeHttpResponse(200, "OK", "application/json", "{\"success\":true}");
        } catch (const std::exception& e) {
            return MakeHttpResponse(400, "Bad Request", "application/json", "{\"error\":\"Invalid JSON\"}");
        }
    }

    // 3. POST /api/max-gamma
    if (path == "/api/max-gamma" && method == "POST") {
        DisplaySettings s = GpuController::Instance().GetCurrentSettings();
        s.gamma = 2.5f;
        GpuController::Instance().ApplySettings(s);
        SettingsManager::Instance().SetCurrentDisplaySettings(s);
        OverlayToast::Instance().ShowToast("MAX DCCW GAMA AKTİF", "Gama: 2.5x");
        return MakeHttpResponse(200, "OK", "application/json", "{\"success\":true,\"gamma\":2.5}");
    }

    // 4. POST /api/reset
    if (path == "/api/reset" && method == "POST") {
        DisplaySettings s;
        GpuController::Instance().ApplySettings(s);
        SettingsManager::Instance().SetCurrentDisplaySettings(s);
        OverlayToast::Instance().ShowToast("EKRAN AYARLARI SIFIRLANDI", "Varsayılan Windows renkleri");
        return MakeHttpResponse(200, "OK", "application/json", "{\"success\":true}");
    }

    // 4b. POST /api/monitor/select
    if (path == "/api/monitor/select" && method == "POST") {
        try {
            json j = json::parse(body);
            int monIndex = j.value("index", -1);
            SettingsManager::Instance().SetTargetMonitorIndex(monIndex);
            DisplaySettings s = GpuController::Instance().GetCurrentSettings();
            GpuController::Instance().ApplySettings(s, monIndex);
            
            std::string monMsg = (monIndex == -1) ? "Tüm Monitörler (Senkronize)" : ("Monitör " + std::to_string(monIndex + 1));
            OverlayToast::Instance().ShowToast("🖥️ HEDEF MONİTÖR", monMsg);
            
            return MakeHttpResponse(200, "OK", "application/json", "{\"success\":true,\"targetMonitorIndex\":" + std::to_string(monIndex) + "}");
        } catch (...) {
            return MakeHttpResponse(400, "Bad Request", "application/json", "{\"error\":\"Invalid JSON\"}");
        }
    }

    // 5. GET /api/profiles
    if (path == "/api/profiles" && method == "GET") {
        auto profiles = ProfileManager::Instance().GetAllProfiles();
        json jArr = json::array();
        for (const auto& p : profiles) {
            jArr.push_back({
                {"id", p.id},
                {"name", p.name},
                {"icon", p.icon},
                {"description", p.description},
                {"exePattern", p.exePattern},
                {"hotkey", p.hotkey},
                {"isBuiltin", p.isBuiltin},
                {"autoApplyOnLaunch", p.autoApplyOnLaunch},
                {"settings", {
                    {"gamma", p.settings.gamma},
                    {"digitalVibrance", p.settings.digitalVibrance},
                    {"brightnessOffset", p.settings.brightnessOffset},
                    {"contrast", p.settings.contrast},
                    {"rgbRed", p.settings.rgbRed},
                    {"rgbGreen", p.settings.rgbGreen},
                    {"rgbBlue", p.settings.rgbBlue},
                    {"sharpness", p.settings.sharpness}
                }}
            });
        }
        return MakeHttpResponse(200, "OK", "application/json", jArr.dump());
    }

    // 6. POST /api/profile/activate
    if (path == "/api/profile/activate" && method == "POST") {
        try {
            json j = json::parse(body);
            std::string id = j.value("id", "");
            GameProfile p = ProfileManager::Instance().GetProfileById(id);
            if (!p.id.empty()) {
                ProfileManager::Instance().SetActiveProfileId(p.id);
                GpuController::Instance().ApplySettings(p.settings);
                SettingsManager::Instance().SetCurrentDisplaySettings(p.settings);
                OverlayToast::Instance().ShowToast(p.icon + " " + p.name, "Profil Aktifleştirildi");
                return MakeHttpResponse(200, "OK", "application/json", "{\"success\":true}");
            }
            return MakeHttpResponse(404, "Not Found", "application/json", "{\"error\":\"Profile not found\"}");
        } catch (...) {
            return MakeHttpResponse(400, "Bad Request", "application/json", "{\"error\":\"Invalid request\"}");
        }
    }

    // 6b. POST /api/profile/save
    if (path == "/api/profile/save" && method == "POST") {
        try {
            json j = json::parse(body);
            GameProfile p;
            p.id = j.value("id", "");
            if (p.id.empty()) {
                p.id = "custom_" + std::to_string(std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count());
            }
            // Sanitize ID: only alphanumeric and underscores
            p.id.erase(std::remove_if(p.id.begin(), p.id.end(), [](char c) {
                return !std::isalnum(c) && c != '_' && c != '-';
            }), p.id.end());

            p.name = j.value("name", "Özel Profil");
            if (p.name.length() > 50) p.name = p.name.substr(0, 50);

            p.icon = j.value("icon", "🎯");
            if (p.icon.length() > 10) p.icon = "🎯";

            p.description = j.value("description", "");
            if (p.description.length() > 200) p.description = p.description.substr(0, 200);

            p.exePattern = j.value("exePattern", "");
            p.hotkey = j.value("hotkey", "");
            p.autoApplyOnLaunch = j.value("autoApplyOnLaunch", true);
            p.isBuiltin = false;

            if (j.contains("settings")) {
                json s = j["settings"];
                p.settings.gamma = std::clamp(s.value("gamma", 1.0f), 0.5f, 3.0f);
                p.settings.digitalVibrance = std::clamp(s.value("digitalVibrance", 0), 0, 100);
                p.settings.brightnessOffset = std::clamp(s.value("brightnessOffset", 0.0f), -1.0f, 1.0f);
                p.settings.contrast = std::clamp(s.value("contrast", 1.0f), 0.5f, 2.5f);
                p.settings.rgbRed = std::clamp(s.value("rgbRed", 1.0f), 0.2f, 2.0f);
                p.settings.rgbGreen = std::clamp(s.value("rgbGreen", 1.0f), 0.2f, 2.0f);
                p.settings.rgbBlue = std::clamp(s.value("rgbBlue", 1.0f), 0.2f, 2.0f);
                p.settings.sharpness = std::clamp(s.value("sharpness", 0.0f), 0.0f, 1.0f);
            }

            bool ok = ProfileManager::Instance().SaveProfile(p);
            if (ok) {
                if (!p.hotkey.empty()) {
                    HotkeyManager::Instance().BindProfileHotkey(p.hotkey, p.id);
                }
                OverlayToast::Instance().ShowToast("💾 PROFİL KAYDEDİLDİ", p.name);
                return MakeHttpResponse(200, "OK", "application/json", "{\"success\":true,\"id\":\"" + p.id + "\"}");
            }
            return MakeHttpResponse(500, "Internal Error", "application/json", "{\"error\":\"Save failed\"}");
        } catch (const std::exception& e) {
            return MakeHttpResponse(400, "Bad Request", "application/json", "{\"error\":\"Invalid JSON\"}");
        }
    }

    // 6c. POST /api/profile/delete
    if (path == "/api/profile/delete" && method == "POST") {
        try {
            json j = json::parse(body);
            std::string id = j.value("id", "");
            bool ok = ProfileManager::Instance().DeleteProfile(id);
            if (ok) {
                OverlayToast::Instance().ShowToast("🗑️ PROFİL SİLİNDİ", id);
                return MakeHttpResponse(200, "OK", "application/json", "{\"success\":true}");
            }
            return MakeHttpResponse(400, "Bad Request", "application/json", "{\"error\":\"Cannot delete profile or not found\"}");
        } catch (...) {
            return MakeHttpResponse(400, "Bad Request", "application/json", "{\"error\":\"Invalid JSON\"}");
        }
    }

    // 6d. GET /api/hotkeys
    if (path == "/api/hotkeys" && method == "GET") {
        HotkeyConfig cfg = SettingsManager::Instance().GetHotkeyConfig();
        json j = {
            {"maxGammaKey", cfg.maxGammaKey},
            {"vibranceKey", cfg.vibranceKey},
            {"quickResetKey", cfg.quickResetKey},
            {"toggleOverlayKey", cfg.toggleOverlayKey},
            {"toggleCrosshairKey", cfg.toggleCrosshairKey},
            {"sniperZoomKey", cfg.sniperZoomKey}
        };
        return MakeHttpResponse(200, "OK", "application/json", j.dump());
    }

    // 6e. POST /api/hotkeys
    if (path == "/api/hotkeys" && method == "POST") {
        try {
            json j = json::parse(body);
            HotkeyConfig cfg = SettingsManager::Instance().GetHotkeyConfig();
            if (j.contains("maxGammaKey")) cfg.maxGammaKey = j["maxGammaKey"].get<std::string>();
            if (j.contains("vibranceKey")) cfg.vibranceKey = j["vibranceKey"].get<std::string>();
            if (j.contains("quickResetKey")) cfg.quickResetKey = j["quickResetKey"].get<std::string>();
            if (j.contains("toggleOverlayKey")) cfg.toggleOverlayKey = j["toggleOverlayKey"].get<std::string>();
            if (j.contains("toggleCrosshairKey")) cfg.toggleCrosshairKey = j["toggleCrosshairKey"].get<std::string>();
            if (j.contains("sniperZoomKey")) cfg.sniperZoomKey = j["sniperZoomKey"].get<std::string>();

            SettingsManager::Instance().SetHotkeyConfig(cfg);
            SettingsManager::Instance().SaveToFile();
            HotkeyManager::Instance().SetConfig(cfg);

            OverlayToast::Instance().ShowToast("⌨️ KISAYOL AYARLARI KAYDEDİLDİ", "Sniper Zoom: " + cfg.sniperZoomKey);
            return MakeHttpResponse(200, "OK", "application/json", "{\"success\":true}");
        } catch (const std::exception& e) {
            return MakeHttpResponse(400, "Bad Request", "application/json", "{\"error\":\"Invalid JSON\"}");
        }
    }

    // 6f. POST /api/zoom/toggle
    if (path == "/api/zoom/toggle" && method == "POST") {
        try {
            bool active = !OverlayToast::Instance().IsSniperZoomActive();
            if (!body.empty()) {
                json j = json::parse(body);
                if (j.contains("active")) active = j["active"].get<bool>();
            }
            OverlayToast::Instance().ToggleSniperZoom(active);
            return MakeHttpResponse(200, "OK", "application/json", "{\"success\":true,\"active\":" + std::string(active ? "true" : "false") + "}");
        } catch (...) {
            return MakeHttpResponse(400, "Bad Request", "application/json", "{\"error\":\"Invalid request\"}");
        }
    }

    // 7. GET /api/updater/check
    if (path == "/api/updater/check" && method == "GET") {
        ReleaseInfo info;
        bool hasUpdate = AutoUpdater::Instance().CheckForUpdate(info);
        json res = {
            {"hasUpdate", hasUpdate},
            {"currentVersion", AutoUpdater::Instance().GetCurrentVersion()},
            {"latestVersion", info.version.empty() ? DUSTFX_VERSION_STRING : info.version},
            {"tagName", info.tagName},
            {"htmlUrl", info.htmlUrl.empty() ? "https://github.com/Dust-exe/DustFX/releases" : info.htmlUrl},
            {"downloadUrl", info.downloadUrl},
            {"releaseNotes", info.releaseNotes},
            {"publishedAt", info.publishedAt}
        };
        return MakeHttpResponse(200, "OK", "application/json", res.dump());
    }

    // 7b. POST /api/updater/download-and-apply
    if (path == "/api/updater/download-and-apply" && method == "POST") {
        ReleaseInfo info;

        // Try to parse downloadUrl + version directly from the POST body (avoids double GitHub API call)
        bool gotInfoFromBody = false;
        try {
            if (!body.empty()) {
                json jbody = json::parse(body);
                info.downloadUrl = jbody.value("downloadUrl", "");
                info.version     = jbody.value("version", "");
                info.tagName     = jbody.value("tagName", "");
                info.htmlUrl     = jbody.value("htmlUrl", "");
                if (!info.downloadUrl.empty()) gotInfoFromBody = true;
            }
        } catch (...) {}

        // Fallback: do a fresh GitHub API check
        if (!gotInfoFromBody) {
            bool hasUpdate = AutoUpdater::Instance().CheckForUpdate(info);
            if (!hasUpdate || info.downloadUrl.empty()) {
                return MakeHttpResponse(200, "OK", "application/json", "{\"success\":false,\"error\":\"No update available or download URL missing\"}");
            }
        }

        if (info.downloadUrl.empty()) {
            return MakeHttpResponse(200, "OK", "application/json", "{\"success\":false,\"error\":\"Download URL is empty\"}");
        }

        std::string tempPath;
#ifdef _WIN32
        char tmpDir[MAX_PATH];
        GetTempPathA(MAX_PATH, tmpDir);
        tempPath = std::string(tmpDir) + "DustFX_Setup.exe";
#else
        tempPath = "/tmp/DustFX_Update";
#endif
        bool downloaded = AutoUpdater::Instance().DownloadUpdate(info, tempPath);
        if (!downloaded) {
            return MakeHttpResponse(200, "OK", "application/json", "{\"success\":false,\"error\":\"Download failed — check internet connection\"}");
        }
        bool applied = AutoUpdater::Instance().ApplyUpdate(tempPath);
        json resObj = {
            {"success", applied},
            {"downloadedTo", tempPath},
            {"version", info.version}
        };
        return MakeHttpResponse(200, "OK", "application/json", resObj.dump());
    }

    // 8. POST /api/open-url — Open URL in default system browser
    if (path == "/api/open-url" && method == "POST") {
        try {
            json j = json::parse(body);
            std::string url = j.value("url", "");
            if (!url.empty()) {
#ifdef _WIN32
                ShellExecuteA(NULL, "open", url.c_str(), NULL, NULL, SW_SHOW);
#else
                std::string cmd = "xdg-open '" + url + "' &";
                system(cmd.c_str());
#endif
                return MakeHttpResponse(200, "OK", "application/json", "{\"success\":true}");
            }
            return MakeHttpResponse(400, "Bad Request", "application/json", "{\"error\":\"No URL provided\"}");
        } catch (...) {
            return MakeHttpResponse(400, "Bad Request", "application/json", "{\"error\":\"Invalid JSON\"}");
        }
    }

    // 8. Static Web Files Serve
    std::string relPath = path;
    if (relPath == "/" || relPath.empty()) {
        relPath = "/index.html";
    }

    std::string filePath = m_webRoot + relPath;
    if (!std::filesystem::exists(filePath) || std::filesystem::is_directory(filePath)) {
        filePath = m_webRoot + "/index.html";
    }

    if (std::filesystem::exists(filePath)) {
        std::ifstream file(filePath, std::ios::binary);
        if (file.is_open()) {
            std::stringstream bufferStream;
            bufferStream << file.rdbuf();
            std::string content = bufferStream.str();

            std::string ext = std::filesystem::path(filePath).extension().string();
            std::string mime = "text/plain";
            if (ext == ".html") mime = "text/html";
            else if (ext == ".css") mime = "text/css";
            else if (ext == ".js" || ext == ".mjs") mime = "application/javascript";
            else if (ext == ".json") mime = "application/json";
            else if (ext == ".svg") mime = "image/svg+xml";
            else if (ext == ".png") mime = "image/png";
            else if (ext == ".jpg" || ext == ".jpeg") mime = "image/jpeg";
            else if (ext == ".ico") mime = "image/x-icon";

            return MakeHttpResponse(200, "OK", mime, content);
        }
    }

    return MakeHttpResponse(404, "Not Found", "text/plain", "404 Not Found");
}

} // namespace dustfx
