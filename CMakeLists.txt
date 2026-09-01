cmake_minimum_required(VERSION 3.20)
project(DustFX VERSION 3.0.2 LANGUAGES C CXX)


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
    # Static link MinGW runtimes — eliminates libgcc_s_seh-1.dll / libstdc++-6.dll dependency
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} -static-libgcc -static-libstdc++")
else()
    find_package(Threads REQUIRED)
    find_package(CURL REQUIRED)
endif()

set(DUSTFX_LIB_SOURCES
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

add_library(DustFX_Lib STATIC ${DUSTFX_LIB_SOURCES})

if(WIN32)
    target_link_libraries(DustFX_Lib PRIVATE
        Threads::Threads
        gdi32 user32 shell32 ole32 ws2_32 wininet urlmon dwmapi
    )
else()
    target_link_libraries(DustFX_Lib PRIVATE
        Threads::Threads
        CURL::libcurl
    )
endif()

if(WIN32)
    add_executable(DustFX WIN32 src/main.cpp)
else()
    add_executable(DustFX src/main.cpp)
endif()

target_link_libraries(DustFX PRIVATE DustFX_Lib)
if(WIN32)
    target_link_libraries(DustFX PRIVATE wininet urlmon dwmapi)
endif()

set_target_properties(DustFX PROPERTIES
    OUTPUT_NAME "DustFX"
)

enable_testing()
add_executable(DustFX_Tests tests/test_http_server.cpp)
target_link_libraries(DustFX_Tests PRIVATE DustFX_Lib)
add_test(NAME HTTP_Server_Tests COMMAND DustFX_Tests)

add_executable(ProfileBenchmark benchmark.cpp)
target_link_libraries(ProfileBenchmark PRIVATE DustFX_Lib)
add_executable(DustFX_Settings_Tests tests/test_settings_manager.cpp)
target_link_libraries(DustFX_Settings_Tests PRIVATE DustFX_Lib)
add_test(NAME Settings_Manager_Tests COMMAND DustFX_Settings_Tests)
