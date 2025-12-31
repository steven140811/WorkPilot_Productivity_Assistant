@echo off
chcp 65001 > nul
setlocal EnableDelayedExpansion

echo ============================================
echo WorkPilot 效能助手 - Windows 安装包构建脚本
echo ============================================
echo.

:: 设置路径
set PROJECT_DIR=%~dp0
set DIST_DIR=%PROJECT_DIR%dist
set BUILD_DIR=%PROJECT_DIR%build
set INSTALLER_DIR=%PROJECT_DIR%installer

:: 检查 Python
echo [1/6] 检查 Python 环境...
python --version > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 错误: 未找到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)

:: 检查 Node.js
echo [2/6] 检查 Node.js 环境...
node --version > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

:: 安装 Python 依赖
echo [3/6] 安装 Python 依赖...
cd /d "%PROJECT_DIR%backend"
pip install -r requirements.txt > nul 2>&1
pip install pyinstaller > nul 2>&1

:: 构建前端
echo [4/6] 构建前端应用...
cd /d "%PROJECT_DIR%frontend"
call npm install > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 警告: npm install 失败，尝试继续...
)

:: 设置生产环境 API URL
set REACT_APP_API_URL=http://localhost:5000
call npm run build > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo 错误: 前端构建失败
    pause
    exit /b 1
)

:: 打包后端
echo [5/6] 打包后端应用...
cd /d "%PROJECT_DIR%"

:: 创建简化的后端打包脚本
python -c "
import PyInstaller.__main__
import os
import shutil

# 清理旧的构建
if os.path.exists('dist/backend'):
    shutil.rmtree('dist/backend')

PyInstaller.__main__.run([
    'backend/app.py',
    '--name=WorkPilot-Backend',
    '--onedir',
    '--console',
    '--add-data=backend/prompts.py;.',
    '--add-data=backend/config.py;.',
    '--add-data=backend/database.py;.',
    '--add-data=backend/generator.py;.',
    '--add-data=backend/parser.py;.',
    '--add-data=backend/llm_client.py;.',
    '--hidden-import=flask',
    '--hidden-import=flask_cors',
    '--hidden-import=sqlite3',
    '--hidden-import=requests',
    '--hidden-import=dotenv',
    '--distpath=dist',
    '--workpath=build',
    '--noconfirm',
])
"

if %ERRORLEVEL% neq 0 (
    echo 错误: 后端打包失败
    pause
    exit /b 1
)

:: 创建安装包目录结构
echo [6/6] 创建安装包目录结构...
if not exist "%INSTALLER_DIR%" mkdir "%INSTALLER_DIR%"
if not exist "%INSTALLER_DIR%\app" mkdir "%INSTALLER_DIR%\app"
if not exist "%INSTALLER_DIR%\app\backend" mkdir "%INSTALLER_DIR%\app\backend"
if not exist "%INSTALLER_DIR%\app\www" mkdir "%INSTALLER_DIR%\app\www"

:: 复制后端
xcopy /E /Y "%DIST_DIR%\WorkPilot-Backend\*" "%INSTALLER_DIR%\app\backend\" > nul

:: 复制前端构建产物
xcopy /E /Y "%PROJECT_DIR%frontend\build\*" "%INSTALLER_DIR%\app\www\" > nul

:: 创建数据目录
if not exist "%INSTALLER_DIR%\app\backend\data" mkdir "%INSTALLER_DIR%\app\backend\data"

:: 复制启动器
copy /Y "%PROJECT_DIR%launcher.py" "%INSTALLER_DIR%\app\" > nul

echo.
echo ============================================
echo 构建完成！
echo ============================================
echo.
echo 安装包文件位于: %INSTALLER_DIR%\app
echo.
echo 下一步:
echo 1. 安装 Inno Setup (https://jrsoftware.org/isinfo.php)
echo 2. 运行 build_installer.iss 生成安装程序
echo.
pause
