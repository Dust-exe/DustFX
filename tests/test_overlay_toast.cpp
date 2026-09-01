#include "../src/overlay/overlay_toast.h"
#include <iostream>
#include <cassert>
#include <string>

// Test macro for convenience
#define ASSERT_RGB(hex, expectedR, expectedG, expectedB) \
    do { \
        uint32_t result = dustfx::HexToRGB(hex); \
        uint8_t r = result & 0xFF; \
        uint8_t g = (result >> 8) & 0xFF; \
        uint8_t b = (result >> 16) & 0xFF; \
        if (r != expectedR || g != expectedG || b != expectedB) { \
            std::cerr << "Test failed for hex: " << hex << "\n"; \
            std::cerr << "Expected: (" << (int)expectedR << ", " << (int)expectedG << ", " << (int)expectedB << ")\n"; \
            std::cerr << "Actual: (" << (int)r << ", " << (int)g << ", " << (int)b << ")\n"; \
            assert(false); \
        } \
    } while (0)

void test_valid_hex() {
    ASSERT_RGB("#000000", 0, 0, 0);
    ASSERT_RGB("#FFFFFF", 255, 255, 255);
    ASSERT_RGB("#FF0000", 255, 0, 0);
    ASSERT_RGB("#00FF00", 0, 255, 0);
    ASSERT_RGB("#0000FF", 0, 0, 255);
    ASSERT_RGB("#123456", 0x12, 0x34, 0x56);
    std::cout << "test_valid_hex passed\n";
}

void test_missing_hash() {
    // Should work without the hash
    ASSERT_RGB("000000", 0, 0, 0);
    ASSERT_RGB("FFFFFF", 255, 255, 255);
    ASSERT_RGB("FF0000", 255, 0, 0);
    std::cout << "test_missing_hash passed\n";
}

void test_invalid_length() {
    // Shorter length should return default RGB(0, 255, 102)
    ASSERT_RGB("#12345", 0, 255, 102);
    ASSERT_RGB("#12", 0, 255, 102);
    ASSERT_RGB("#", 0, 255, 102);
    ASSERT_RGB("", 0, 255, 102);
    ASSERT_RGB("12345", 0, 255, 102);

    // Longer length is ok as long as first 6 chars are valid
    ASSERT_RGB("#FFAABBCC", 0xFF, 0xAA, 0xBB);
    std::cout << "test_invalid_length passed\n";
}

void test_invalid_characters() {
    // Invalid characters should trigger catch block and return default RGB(0, 255, 102)
    ASSERT_RGB("#GGHHII", 0, 255, 102);
    ASSERT_RGB("#  0000", 0, 255, 102);
    ASSERT_RGB("#-10000", 0, 255, 102);
    ASSERT_RGB("random", 0, 255, 102);
    std::cout << "test_invalid_characters passed\n";
}

void test_transparency_chroma_key_guard() {
    // Exact match for (255, 0, 255) should be modified to (254, 0, 254)
    ASSERT_RGB("#FF00FF", 254, 0, 254);

    // Slight variations should be left alone
    ASSERT_RGB("#FE00FF", 254, 0, 255);
    ASSERT_RGB("#FF01FF", 255, 1, 255);
    ASSERT_RGB("#FF00FE", 255, 0, 254);
    std::cout << "test_transparency_chroma_key_guard passed\n";
}

int main() {
    std::cout << "Running Overlay Toast Tests...\n";
    test_valid_hex();
    test_missing_hash();
    test_invalid_length();
    test_invalid_characters();
    test_transparency_chroma_key_guard();
    std::cout << "All Overlay Toast Tests passed!\n";
    return 0;
}
