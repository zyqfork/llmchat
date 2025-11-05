@echo off
REM 清理旧的代理文件
REM 在确认新代码工作正常后运行此脚本

echo 🧹 清理旧的代理文件...

REM 删除前端旧文件
echo 删除前端旧文件...
del /F /Q app\utils\stream.ts 2>nul
del /F /Q app\utils\tauri-proxy.ts 2>nul

REM 删除后端旧文件
echo 删除后端旧文件...
del /F /Q src-tauri\src\stream.rs 2>nul
del /F /Q src-tauri\src\proxy_command.rs 2>nul

echo ✅ 旧文件已删除！
echo.
echo ⚠️  请手动更新 src-tauri\src\main.rs：
echo    1. 删除 'mod stream;' 和 'mod proxy_command;'
echo    2. 删除 'stream::stream_fetch' 和 'proxy_command::proxy_fetch'
echo.
echo 然后重新编译：
echo    yarn app:dev

pause
