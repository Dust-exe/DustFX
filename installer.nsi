!include "MUI2.nsh"
!include "FileFunc.nsh"

Name "DustFX"
OutFile "DustFX_Setup.exe"
InstallDir "$LOCALAPPDATA\DustFX"
RequestExecutionLevel admin
SetCompressor lzma

VIProductVersion "1.4.0.0"
VIAddVersionKey "ProductName" "DustFX"
VIAddVersionKey "CompanyName" "Dust Studio"
VIAddVersionKey "LegalCopyright" "Copyright (C) 2026 Dust Studio. All rights reserved."
VIAddVersionKey "FileDescription" "DustFX GPU & DCCW Gamma Optimizer Setup"
VIAddVersionKey "FileVersion" "1.4.0"
VIAddVersionKey "OriginalFilename" "DustFX_Setup.exe"
VIAddVersionKey "InternalName" "DustFX_Setup"

!define MUI_ABORTWARNING
!define MUI_ICON "app.ico"
!define MUI_UNICON "app.ico"
Icon "app.ico"
UninstallIcon "app.ico"

; Installer Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\DustFX.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Launch DustFX"
!insertmacro MUI_PAGE_FINISH

; Uninstaller Pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Languages (English primary, Turkish option)
!insertmacro MUI_LANGUAGE "English"
!insertmacro MUI_LANGUAGE "Turkish"

!insertmacro MUI_RESERVEFILE_LANGDLL

Function .onInit
  ; Terminate any existing running DustFX process before installing
  nsExec::Exec 'cmd /c taskkill /F /IM DustFX.exe /T >nul 2>&1'
  Sleep 600
FunctionEnd

Section "MainSection" SEC01
  SetOutPath "$INSTDIR"
  SetOverwrite on

  ; Terminate again right before copying files to avoid file-in-use errors
  nsExec::Exec 'cmd /c taskkill /F /IM DustFX.exe /T >nul 2>&1'
  Sleep 400

  ; Clean old web dist directory if updating from older broken version
  RMDir /r "$INSTDIR\web\dist"

  File "DustFX.exe"
  File "app.ico"
  File "LICENSE.txt"

  SetOutPath "$INSTDIR\web\dist"
  File /r "web\dist\*.*"

  SetOutPath "$INSTDIR"

  ; Create Shortcuts with Custom Icon
  CreateDirectory "$SMPROGRAMS\DustFX"
  CreateShortcut "$SMPROGRAMS\DustFX\DustFX.lnk" "$INSTDIR\DustFX.exe" "" "$INSTDIR\app.ico" 0
  CreateShortcut "$SMPROGRAMS\DustFX\Kaldır (Uninstall).lnk" "$INSTDIR\Uninstall.exe" "" "$INSTDIR\app.ico" 0
  CreateShortcut "$DESKTOP\DustFX.lnk" "$INSTDIR\DustFX.exe" "" "$INSTDIR\app.ico" 0

  ; Write Uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Registry for Add/Remove Programs
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\DustFX" "DisplayName" "DustFX"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\DustFX" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\DustFX" "DisplayIcon" '"$INSTDIR\app.ico"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\DustFX" "DisplayVersion" "1.4.0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\DustFX" "Publisher" "Dust Studio"
SectionEnd

Section "Uninstall"
  ; Terminate running DustFX before uninstalling
  nsExec::Exec 'cmd /c taskkill /F /IM DustFX.exe /T >nul 2>&1'
  Sleep 500

  Delete "$DESKTOP\DustFX.lnk"
  Delete "$SMPROGRAMS\DustFX\DustFX.lnk"
  Delete "$SMPROGRAMS\DustFX\Kaldır (Uninstall).lnk"
  RMDir "$SMPROGRAMS\DustFX"

  RMDir /r "$INSTDIR\web"
  Delete "$INSTDIR\DustFX.exe"
  Delete "$INSTDIR\app.ico"
  Delete "$INSTDIR\LICENSE.txt"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR"

  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\DustFX"
SectionEnd
