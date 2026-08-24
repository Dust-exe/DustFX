!include "MUI2.nsh"
!include "FileFunc.nsh"

Name "DustFX PRO"
OutFile "DustFX_Setup.exe"
InstallDir "$LOCALAPPDATA\DustFX"
RequestExecutionLevel user
SetCompressor /SOLID lzma

VIProductVersion "1.1.0.0"
VIAddVersionKey "ProductName" "DustFX PRO"
VIAddVersionKey "CompanyName" "Dust Studio"
VIAddVersionKey "LegalCopyright" "Copyright (C) 2026 Dust Studio"
VIAddVersionKey "FileDescription" "DustFX GPU & DCCW Gamma Optimizer Setup"
VIAddVersionKey "FileVersion" "1.1.0"

!define MUI_ABORTWARNING

; Installer Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_RUN "$INSTDIR\DustFX.exe"
!define MUI_FINISHPAGE_RUN_TEXT "DustFX PRO'yu Başlat"
!insertmacro MUI_PAGE_FINISH

; Uninstaller Pages
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Turkish"

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

  File "DustFX.exe"

  SetOutPath "$INSTDIR\web\dist"
  File /r "web\dist\*.*"

  SetOutPath "$INSTDIR"

  ; Create Shortcuts
  CreateDirectory "$SMPROGRAMS\DustFX"
  CreateShortcut "$SMPROGRAMS\DustFX\DustFX PRO.lnk" "$INSTDIR\DustFX.exe"
  CreateShortcut "$SMPROGRAMS\DustFX\Kaldır (Uninstall).lnk" "$INSTDIR\Uninstall.exe"
  CreateShortcut "$DESKTOP\DustFX PRO.lnk" "$INSTDIR\DustFX.exe"

  ; Write Uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Registry for Add/Remove Programs
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\DustFX" "DisplayName" "DustFX PRO"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\DustFX" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\DustFX" "DisplayIcon" '"$INSTDIR\DustFX.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\DustFX" "DisplayVersion" "1.1.0"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\DustFX" "Publisher" "Dust Studio"
SectionEnd

Section "Uninstall"
  ; Terminate running DustFX before uninstalling
  nsExec::Exec 'cmd /c taskkill /F /IM DustFX.exe /T >nul 2>&1'
  Sleep 500

  Delete "$DESKTOP\DustFX PRO.lnk"
  Delete "$SMPROGRAMS\DustFX\DustFX PRO.lnk"
  Delete "$SMPROGRAMS\DustFX\Kaldır (Uninstall).lnk"
  RMDir "$SMPROGRAMS\DustFX"

  RMDir /r "$INSTDIR\web"
  Delete "$INSTDIR\DustFX.exe"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR"

  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\DustFX"
SectionEnd
