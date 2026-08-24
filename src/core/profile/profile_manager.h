#pragma once

#include "core/common.h"
#include <vector>
#include <string>
#include <mutex>

namespace dustfx {

class ProfileManager {
public:
    static ProfileManager& Instance();

    void Initialize(const std::string& profilesDir = "config/profiles");
    
    std::vector<GameProfile> GetAllProfiles() const;
    GameProfile GetProfileById(const std::string& id) const;
    GameProfile GetProfileByExe(const std::string& exeName) const;
    
    bool SaveProfile(const GameProfile& profile);
    bool DeleteProfile(const std::string& id);
    
    std::string ExportProfileJson(const std::string& id) const;
    bool ImportProfileJson(const std::string& jsonStr);

    void SetActiveProfileId(const std::string& id);
    std::string GetActiveProfileId() const;

private:
    ProfileManager();
    ~ProfileManager() = default;

    void LoadBuiltinProfiles();
    void LoadUserProfiles();

    mutable std::mutex m_mutex;
    std::string m_profilesDir = "config/profiles";
    std::vector<GameProfile> m_profiles;
    std::string m_activeProfileId = "pvp_contrast";
};

} // namespace dustfx
