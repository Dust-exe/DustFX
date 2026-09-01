#define private public
#include "../src/server/http_server.h"
#undef private
#include <iostream>
#include <cassert>
#include <string>

void assert_contains(const std::string& str, const std::string& substr, const std::string& msg) {
    if (str.find(substr) == std::string::npos) {
        std::cerr << "Test failed: " << msg << "\n";
        std::cerr << "Expected substring: " << substr << "\n";
        std::cerr << "Actual string: " << str << "\n";
        assert(false);
    }
}

void test_options() {
    dustfx::HttpServer server;
    std::string resp = server.ProcessRequest("OPTIONS", "/api/status", "");
    assert_contains(resp, "HTTP/1.1 200 OK", "OPTIONS should return 200 OK");
    assert_contains(resp, "Access-Control-Allow-Methods", "OPTIONS should include CORS headers");
    std::cout << "test_options passed\n";
}

void test_404_not_found() {
    dustfx::HttpServer server;
    std::string resp = server.ProcessRequest("GET", "/api/nonexistent", "");
    assert_contains(resp, "HTTP/1.1 404 Not Found", "Invalid endpoint should return 404 Not Found");
    std::cout << "test_404_not_found passed\n";
}

void test_invalid_json() {
    dustfx::HttpServer server;
    std::string resp = server.ProcessRequest("POST", "/api/profile/save", "{ invalid json ");
    assert_contains(resp, "HTTP/1.1 400 Bad Request", "Invalid JSON should return 400 Bad Request");
    assert_contains(resp, "Invalid JSON", "Invalid JSON should be mentioned in response");
    std::cout << "test_invalid_json passed\n";
}

int main() {
    std::cout << "Running HTTP Server Tests...\n";
    test_options();
    test_404_not_found();
    test_invalid_json();
    std::cout << "All HTTP Server Tests passed!\n";
    return 0;
}
