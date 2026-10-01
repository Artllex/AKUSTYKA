@echo off
if exist "%~dp0product\builds\windows-0.85.0\AKUSTYKA-win32-x64\AKUSTYKA.exe" (
  start "" "%~dp0product\builds\windows-0.85.0\AKUSTYKA-win32-x64\AKUSTYKA.exe"
) else (
  start "" "%~dp0product\builds\windows-0.84.0\AKUSTYKA-win32-x64\AKUSTYKA.exe"
)
