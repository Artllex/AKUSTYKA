@echo off
if exist "%~dp0product\builds\windows-0.101.0\AKUSTYKA-win32-x64\AKUSTYKA.exe" (
  start "" "%~dp0product\builds\windows-0.101.0\AKUSTYKA-win32-x64\AKUSTYKA.exe"
) else (
  start "" "%~dp0product\builds\windows-0.100.0\AKUSTYKA-win32-x64\AKUSTYKA.exe"
)
