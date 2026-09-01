# CMake generated Testfile for 
# Source directory: /root/DustFX
# Build directory: /root/DustFX/build-win
# 
# This file includes the relevant testing commands required for 
# testing this directory and lists subdirectories to be tested as well.
add_test([=[HTTP_Server_Tests]=] "/root/DustFX/build-win/bin/DustFX_Tests.exe")
set_tests_properties([=[HTTP_Server_Tests]=] PROPERTIES  _BACKTRACE_TRIPLES "/root/DustFX/CMakeLists.txt;75;add_test;/root/DustFX/CMakeLists.txt;0;")
add_test([=[Settings_Manager_Tests]=] "/root/DustFX/build-win/bin/DustFX_Settings_Tests.exe")
set_tests_properties([=[Settings_Manager_Tests]=] PROPERTIES  _BACKTRACE_TRIPLES "/root/DustFX/CMakeLists.txt;81;add_test;/root/DustFX/CMakeLists.txt;0;")
