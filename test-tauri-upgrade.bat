@echo off
echo ========================================
echo Tauri 2.9 升级测试脚本
echo ========================================
echo.

echo [1/4] 检查 Tauri CLI 版本...
call yarn tauri --version
echo.

echo [2/4] 安装 Node.js 依赖...
call yarn install
if %errorlevel% neq 0 (
    echo 错误: Node.js 依赖安装失败
    pause
    exit /b 1
)
echo.

echo [3/4] 更新 Rust 依赖...
cd src-tauri
call cargo update
if %errorlevel% neq 0 (
    echo 错误: Rust 依赖更新失败
    cd ..
    pause
    exit /b 1
)

echo [4/4] 检查 Rust 编译...
call cargo check
if %errorlevel% neq 0 (
    echo 错误: Rust 编译检查失败
    cd ..
    pause
    exit /b 1
)
cd ..
echo.

echo ========================================
echo 升级测试完成！
echo ========================================
echo.
echo 下一步:
echo 1. 运行开发模式: yarn app:dev
echo 2. 构建应用: yarn app:build
echo.
pause
