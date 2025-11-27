@echo off
chcp 65001 >nul
title AI工具导航 - 后台管理系统

echo ========================================
echo    AI工具导航 - 后台管理系统
echo ========================================
echo.
echo 正在启动后台管理系统...
echo.

cd /d "%~dp0admin"

echo 检查依赖...
if not exist "node_modules\" (
    echo 首次运行，正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo.
        echo 依赖安装失败！
        pause
        exit /b 1
    )
)

echo.
echo 启动开发服务器...
echo 服务器地址: http://localhost:3001
echo.
echo 浏览器将在5秒后自动打开...
echo 关闭此窗口将停止服务器
echo ========================================
echo.

start /b cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3001"

call npm run dev

pause
