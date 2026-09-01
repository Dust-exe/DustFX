#include "core/profile/profile_manager.h"
#include <iostream>
#include <chrono>
#include <filesystem>
#include <fstream>
#include <vector>

void create_dummy_profiles(const std::string& dir, int count) {
    std::filesystem::create_directories(dir);
    for (int i = 0; i < count; ++i) {
        std::string path = dir + "/profile_" + std::to_string(i) + ".json";
        std::ofstream f(path);
        f << R"({
            "id": "profile_)" << i << R"(",
            "name": "Profile )" << i << R"(",
            "icon": "🎯",
            "description": "Test profile",
            "exePattern": "test.exe",
            "settings": {
                "gamma": 1.0,
                "digitalVibrance": 50,
                "brightnessOffset": 0.0,
                "contrast": 1.0,
                "rgbRed": 1.0,
                "rgbGreen": 1.0,
                "rgbBlue": 1.0,
                "sharpness": 0.0,
                "colorTemperature": 6500.0,
                "shadowDetail": 0.0,
                "bloom": 0.0,
                "crosshairEnabled": true,
                "crosshairStyle": "gap_cross",
                "crosshairColor": "#00FF66",
                "crosshairSize": 10,
                "crosshairThickness": 2,
                "crosshairGap": 4,
                "crosshairDotSize": 0,
                "crosshairOutline": 1,
                "crosshairOpacity": 1.0,
                "sniperZoomEnabled": false
            },
            "hotkey": "Ctrl+Shift+)" << (i % 10) << R"(",
            "autoApplyOnLaunch": true,
            "isBuiltin": false
        })";
    }
}

int main() {
    std::string test_dir = "test_profiles_benchmark";
    create_dummy_profiles(test_dir, 5000);

    auto start = std::chrono::high_resolution_clock::now();

    // We only want to benchmark the loading part.
    // Initialize will call LoadUserProfiles
    dustfx::ProfileManager::Instance().Initialize(test_dir);

    auto end = std::chrono::high_resolution_clock::now();

    std::chrono::duration<double, std::milli> elapsed = end - start;
    std::cout << "Loaded " << dustfx::ProfileManager::Instance().GetAllProfiles().size()
              << " profiles in " << elapsed.count() << " ms" << std::endl;

    // cleanup
    std::filesystem::remove_all(test_dir);
    return 0;
}
