cmake_minimum_required(VERSION 3.20)
project(DustFX VERSION 1.6.0 LANGUAGES C CXX)


set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)

include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Version definitions
add_compile_definitions(
    DUSTFX_VERSION_STRING="${PROJECT_VERSION}"
    DUSTFX_VERSION_MAJOR=${PROJECT_VERSION_MAJOR}
    DUSTFX_VERSION_MINOR=${PROJECT_VERSION_MINOR}
    DUSTFX_VERSION_PATCH=${PROJECT_VERSION_PATCH}
)

if(WIN32)
    add_compile_definitions(DUSTFX_WIN32 WIN32_LEAN_AND_MEAN)
    find_package(Threads REQUIRED)
else()
    find_package(Threads REQUIRED)
    find_package(CURL REQUIRED)
endif()

set(DUSTFX_SOURCES
    src/main.cpp
    src/core/gpu/gpu_controller.cpp
    src/core/display/monitor_manager.cpp
    src/core/profile/profile_manager.cpp
    src/core/hotkey/hotkey_manager.cpp
    src/core/process/process_watcher.cpp
    src/core/config/settings_manager.cpp
    src/core/updater/auto_updater.cpp
    src/core/app/dustfx_app.cpp
    src/overlay/overlay_toast.cpp
    src/server/http_server.cpp
)

if(WIN32)
    add_executable(DustFX WIN32 ${DUSTFX_SOURCES})
    target_link_libraries(DustFX PRIVATE
        Threads::Threads
        gdi32 user32 shell32 ole32 ws2_32
    )
else()
    add_executable(DustFX ${DUSTFX_SOURCES})
    target_link_libraries(DustFX PRIVATE
        Threads::Threads
        CURL::libcurl
    )
endif()

set_target_properties(DustFX PROPERTIES
    OUTPUT_NAME "DustFX"
)
