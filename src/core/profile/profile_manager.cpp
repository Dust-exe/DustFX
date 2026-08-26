#include "core/profile/profile_manager.h"
#include "core/hotkey/hotkey_manager.h"
#include <nlohmann/json.hpp>
#include <iostream>
#include <fstream>
#include <filesystem>
#include <algorithm>

namespace dustfx {

using json = nlohmann::json;

static json DisplaySettingsToJson(const DisplaySettings& s) {
    return json{
        {"gamma", s.gamma},
        {"digitalVibrance", s.digitalVibrance},
        {"brightnessOffset", s.brightnessOffset},
        {"contrast", s.contrast},
        {"rgbRed", s.rgbRed},
        {"rgbGreen", s.rgbGreen},
        {"rgbBlue", s.rgbBlue},
        {"sharpness", s.sharpness},
        {"crosshairEnabled", s.crosshairEnabled},
        {"crosshairStyle", s.crosshairStyle},
        {"crosshairColor", s.crosshairColor},
        {"crosshairSize", s.crosshairSize},
        {"sniperZoomEnabled", s.sniperZoomEnabled},
        {"sniperZoomFactor", s.sniperZoomFactor}
    };
}

static DisplaySettings JsonToDisplaySettings(const json& j) {
    DisplaySettings s;
    s.gamma = j.value("gamma", 1.0f);
    s.digitalVibrance = j.value("digitalVibrance", 0);
    s.brightnessOffset = j.value("brightnessOffset", 0.0f);
    s.contrast = j.value("contrast", 1.0f);
    s.rgbRed = j.value("rgbRed", 1.0f);
    s.rgbGreen = j.value("rgbGreen", 1.0f);
    s.rgbBlue = j.value("rgbBlue", 1.0f);
    s.sharpness = j.value("sharpness", 0.0f);
    s.crosshairEnabled = j.value("crosshairEnabled", false);
    s.crosshairStyle = j.value("crosshairStyle", "dot");
    s.crosshairColor = j.value("crosshairColor", "#00FF66");
    s.crosshairSize = j.value("crosshairSize", 6);
    s.sniperZoomEnabled = j.value("sniperZoomEnabled", false);
    s.sniperZoomFactor = j.value("sniperZoomFactor", 1.5f);
    return s;
}

static json GameProfileToJson(const GameProfile& p) {
    return json{
        {"id", p.id},
        {"name", p.name},
        {"icon", p.icon},
        {"description", p.description},
        {"exePattern", p.exePattern},
        {"settings", DisplaySettingsToJson(p.settings)},
        {"hotkey", p.hotkey},
        {"autoApplyOnLaunch", p.autoApplyOnLaunch},
        {"isBuiltin", p.isBuiltin}
    };
}

static GameProfile JsonToGameProfile(const json& j) {
    GameProfile p;
    p.id = j.value("id", "custom_profile");
    p.name = j.value("name", "Özel Profil");
    p.icon = j.value("icon", "🎯");
    p.description = j.value("description", "");
    p.exePattern = j.value("exePattern", "");
    if (j.contains("settings")) {
        p.settings = JsonToDisplaySettings(j["settings"]);
    }
    p.hotkey = j.value("hotkey", "");
    p.autoApplyOnLaunch = j.value("autoApplyOnLaunch", true);
    p.isBuiltin = j.value("isBuiltin", false);
    return p;
}

ProfileManager& ProfileManager::Instance() {
    static ProfileManager instance;
    return instance;
}

ProfileManager::ProfileManager() = default;

void ProfileManager::Initialize(const std::string& profilesDir) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_profilesDir = profilesDir;
    m_profiles.clear();

    try {
        std::filesystem::create_directories(m_profilesDir);
    } catch (...) {}

    LoadBuiltinProfiles();
    LoadUserProfiles();

    // Bind hotkeys for profiles to HotkeyManager
    for (const auto& p : m_profiles) {
        if (!p.hotkey.empty()) {
            HotkeyManager::Instance().BindProfileHotkey(p.hotkey, p.id);
        }
    }

    std::cout << "[ProfileManager] Loaded " << m_profiles.size() << " display profiles." << std::endl;
}

void ProfileManager::LoadBuiltinProfiles() {
    // 1. FiveM & GTA ReShade Ultra Vivid
    {
        GameProfile p;
        p.id = "fivem_reshade";
        p.name = "FiveM / GTA ReShade Ultra Vivid";
        p.icon = "🎮";
        p.description = "ReShade Technicolor & HDR Canlılık simülasyonu. Göz alıcı zengin renkler ve netlik.";
        p.exePattern = "FiveM.exe;GTA5.exe";
        p.settings.gamma = 1.15f;
        p.settings.digitalVibrance = 85;
        p.settings.brightnessOffset = 0.02f;
        p.settings.contrast = 1.20f;
        p.settings.sharpness = 0.50f;
        p.settings.colorTemperature = 6200.0f;
        p.settings.shadowDetail = 0.15f;
        p.hotkey = "F6";
        p.isBuiltin = true;
        m_profiles.push_back(p);
    }

    // 2. Gece Görüşü Boost
    {
        GameProfile p;
        p.id = "night_vision";
        p.name = "Gece Görüşü Boost";
        p.icon = "🌙";
        p.description = "Karanlık haritalarda, gece operasyonlarında ve kapalı binalarda görüş mesafesini maksimuma çıkarır.";
        p.exePattern = "";
        p.settings.gamma = 2.0f;
        p.settings.digitalVibrance = 55;
        p.settings.brightnessOffset = 0.12f;
        p.settings.contrast = 1.15f;
        p.settings.sharpness = 0.5f;
        p.settings.shadowDetail = 0.30f;
        p.hotkey = "F9";
        p.isBuiltin = true;
        m_profiles.push_back(p);
    }

    // 3. Mağara Parlatıcı Modu
    {
        GameProfile p;
        p.id = "cave_boost";
        p.name = "Mağara Parlatıcı Modu";
        p.icon = "🕳️";
        p.description = "Zifiri karanlık tüneller ve yeraltı alanları için maksimum gama ve derin gölge kurtarma.";
        p.exePattern = "RustClient.exe;EscapeFromTarkov.exe";
        p.settings.gamma = 2.5f;
        p.settings.digitalVibrance = 40;
        p.settings.brightnessOffset = 0.20f;
        p.settings.contrast = 1.25f;
        p.settings.shadowDetail = 0.50f;
        p.hotkey = "F7";
        p.isBuiltin = true;
        m_profiles.push_back(p);
    }

    // 4. CS2 & Valorant PVP Netlik
    {
        GameProfile p;
        p.id = "pvp_contrast";
        p.name = "CS2 & Valorant PVP Netlik";
        p.icon = "🎯";
        p.description = "Düşman silüetlerini keskinleştiren (CAS Sharpening) ve hızlı hedef almayı sağlayan rekabetçi mod.";
        p.exePattern = "cs2.exe;VALORANT-Win64-Shipping.exe";
        p.settings.gamma = 1.40f;
        p.settings.digitalVibrance = 80;
        p.settings.brightnessOffset = 0.05f;
        p.settings.contrast = 1.30f;
        p.settings.sharpness = 0.80f;
        p.settings.shadowDetail = 0.20f;
        p.settings.crosshairEnabled = true;
        p.settings.crosshairStyle = "cross";
        p.settings.crosshairColor = "#00FF66";
        p.hotkey = "F8";
        p.isBuiltin = true;
        m_profiles.push_back(p);
    }

    // 5. FiveM Gece & Siber Şehir
    {
        GameProfile p;
        p.id = "fivem_night_neon";
        p.name = "FiveM Gece & Siber Şehir";
        p.icon = "🌆";
        p.description = "Karanlık sokakları açıp neon tabela ve araba farlarını parlatan sinematik gece filtresi.";
        p.exePattern = "FiveM.exe";
        p.settings.gamma = 1.65f;
        p.settings.digitalVibrance = 75;
        p.settings.contrast = 1.25f;
        p.settings.sharpness = 0.55f;
        p.settings.colorTemperature = 7200.0f;
        p.settings.shadowDetail = 0.40f;
        p.hotkey = "F5";
        p.isBuiltin = true;
        m_profiles.push_back(p);
    }

    // 6. Göz Dinlendirme (Mavi Işık Filtresi)
    {
        GameProfile p;
        p.id = "eye_care";
        p.name = "Göz Dinlendirme Modu";
        p.icon = "👁️";
        p.description = "Gece geç saatlerde göz yorgunluğunu azaltan yumuşak sıcak mavi ışık kırma filtresi.";
        p.exePattern = "";
        p.settings.gamma = 0.95f;
        p.settings.digitalVibrance = 0;
        p.settings.brightnessOffset = -0.05f;
        p.settings.contrast = 0.95f;
        p.settings.colorTemperature = 3800.0f;
        p.settings.rgbRed = 1.0f;
        p.settings.rgbGreen = 0.88f;
        p.settings.rgbBlue = 0.65f;
        p.hotkey = "";
        p.isBuiltin = true;
        m_profiles.push_back(p);
    }
}

void ProfileManager::LoadUserProfiles() {
    try {
        if (!std::filesystem::exists(m_profilesDir)) return;

        for (const auto& entry : std::filesystem::directory_iterator(m_profilesDir)) {
            if (entry.is_regular_file() && entry.path().extension() == ".json") {
                std::ifstream f(entry.path());
                if (f.is_open()) {
                    json j;
                    f >> j;
                    GameProfile p = JsonToGameProfile(j);
                    p.isBuiltin = false;
                    
                    // Replace if ID already exists, or push
                    auto it = std::find_if(m_profiles.begin(), m_profiles.end(), [&](const GameProfile& ex) {
                        return ex.id == p.id;
                    });
                    if (it != m_profiles.end()) {
                        *it = p;
                    } else {
                        m_profiles.push_back(p);
                    }
                }
            }
        }
    } catch (const std::exception& e) {
        std::cerr << "[ProfileManager] Error loading user profiles: " << e.what() << std::endl;
    }
}

std::vector<GameProfile> ProfileManager::GetAllProfiles() const {
    std::lock_guard<std::mutex> lock(m_mutex);
    return m_profiles;
}

GameProfile ProfileManager::GetProfileById(const std::string& id) const {
    std::lock_guard<std::mutex> lock(m_mutex);
    for (const auto& p : m_profiles) {
        if (p.id == id) return p;
    }
    return m_profiles.empty() ? GameProfile() : m_profiles[0];
}

GameProfile ProfileManager::GetProfileByExe(const std::string& exeName) const {
    std::lock_guard<std::mutex> lock(m_mutex);
    std::string lowerExe = exeName;
    std::transform(lowerExe.begin(), lowerExe.end(), lowerExe.begin(), ::tolower);

    for (const auto& p : m_profiles) {
        if (!p.autoApplyOnLaunch || p.exePattern.empty()) continue;

        std::string lowerPattern = p.exePattern;
        std::transform(lowerPattern.begin(), lowerPattern.end(), lowerPattern.begin(), ::tolower);

        if (lowerPattern.find(lowerExe) != std::string::npos) {
            return p;
        }
    }
    return GameProfile();
}

bool ProfileManager::SaveProfile(const GameProfile& profile) {
    std::lock_guard<std::mutex> lock(m_mutex);
    
    auto it = std::find_if(m_profiles.begin(), m_profiles.end(), [&](const GameProfile& ex) {
        return ex.id == profile.id;
    });

    if (it != m_profiles.end()) {
        *it = profile;
    } else {
        m_profiles.push_back(profile);
    }

    try {
        std::string path = m_profilesDir + "/" + profile.id + ".json";
        std::ofstream f(path);
        if (f.is_open()) {
            f << GameProfileToJson(profile).dump(2);
            return true;
        }
    } catch (...) {}

    return false;
}

bool ProfileManager::DeleteProfile(const std::string& id) {
    std::lock_guard<std::mutex> lock(m_mutex);
    
    auto it = std::find_if(m_profiles.begin(), m_profiles.end(), [&](const GameProfile& ex) {
        return ex.id == id && !ex.isBuiltin;
    });

    if (it != m_profiles.end()) {
        m_profiles.erase(it);
        try {
            std::filesystem::remove(m_profilesDir + "/" + id + ".json");
        } catch (...) {}
        return true;
    }

    return false;
}

std::string ProfileManager::ExportProfileJson(const std::string& id) const {
    GameProfile p = GetProfileById(id);
    return GameProfileToJson(p).dump(2);
}

bool ProfileManager::ImportProfileJson(const std::string& jsonStr) {
    try {
        json j = json::parse(jsonStr);
        GameProfile p = JsonToGameProfile(j);
        p.isBuiltin = false;
        return SaveProfile(p);
    } catch (...) {
        return false;
    }
}

void ProfileManager::SetActiveProfileId(const std::string& id) {
    std::lock_guard<std::mutex> lock(m_mutex);
    m_activeProfileId = id;
}

std::string ProfileManager::GetActiveProfileId() const {
    std::lock_guard<std::mutex> lock(m_mutex);
    return m_activeProfileId;
}

} // namespace dustfx
