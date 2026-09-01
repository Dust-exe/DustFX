#include "../src/core/config/settings_manager.h"
#include <iostream>
#include <cassert>
#include <filesystem>

void test_save_to_file_error() {
    auto& manager = dustfx::SettingsManager::Instance();

    std::filesystem::path temp_dir = std::filesystem::temp_directory_path() / "dustfx_test_dir_error";
    std::filesystem::create_directories(temp_dir);

    // Passing a directory path as if it was a file should fail the std::ofstream
    bool result = manager.SaveToFile(temp_dir.string());

    if (result) {
        std::cerr << "Test failed: SaveToFile should have returned false when writing to a directory path\n";

        // Cleanup
        std::filesystem::remove_all(temp_dir);

        assert(false);
    }

    // Cleanup
    std::filesystem::remove_all(temp_dir);

    std::cout << "test_save_to_file_error passed\n";
}

int main() {
    std::cout << "Running Settings Manager Tests...\n";
    test_save_to_file_error();
    std::cout << "All Settings Manager Tests passed!\n";
    return 0;
}
