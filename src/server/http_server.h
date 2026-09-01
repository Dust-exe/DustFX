#pragma once

#include <string>
#include <thread>
#include <atomic>
#include <functional>
#include <memory>
#include <unordered_map>
#include <mutex>

namespace dustfx {

class HttpServer {
public:
    static HttpServer& Instance();

    HttpServer();
    ~HttpServer();

    bool Start(int port = 19840, const std::string& webRoot = "./web/dist");
    void Stop();
    bool IsRunning() const { return m_running.load(); }
    int GetPort() const { return m_port; }

private:
    void ServerLoop();
    void HandleClient(int clientSocket);
    std::string ProcessRequest(const std::string& method, const std::string& path, const std::string& body);

    int m_port = 19840;
    std::string m_webRoot = "./web/dist";
    std::atomic<bool> m_running{false};
    std::thread m_serverThread;
    uintptr_t m_serverSocket = 0;

    struct CachedFile {
        std::string content;
        std::string mime;
    };
    std::unordered_map<std::string, CachedFile> m_fileCache;
    std::mutex m_cacheMutex;
};

} // namespace dustfx
