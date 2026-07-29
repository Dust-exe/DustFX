@echo off
echo ===================================================
echo   Compiling DustFX (Single Standalone EXE with Icon)
echo ===================================================
"C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /target:winexe /optimize+ /win32icon:app.ico /r:System.dll,System.Drawing.dll,System.Windows.Forms.dll /out:DustFX.exe DustFX.cs

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo SUCCESS: DustFX.exe created successfully with embedded Icon!
    echo ===================================================
) else (
    echo.
    echo BUILD FAILED! Check compiler errors above.
)
