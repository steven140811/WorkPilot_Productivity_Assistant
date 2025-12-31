@echo off
chcp 65001 > nul
setlocal EnableDelayedExpansion

echo ============================================
echo WorkPilot 效能助手 - 一键打包构建脚本
echo ============================================
echo.
echo 此脚本将:
echo 1. 构建前端 React 应用
echo 2. 打包后端 Python 应用
echo 3. 打包主启动器
echo 4. 生成完整的安装包
echo.

:: 设置路径
set PROJECT_DIR=%~dp0
set DIST_DIR=%PROJECT_DIR%dist
set BUILD_DIR=%PROJECT_DIR%build
set OUTPUT_DIR=%PROJECT_DIR%installer\output

:: 创建必要的目录
if not exist "%DIST_DIR%" mkdir "%DIST_DIR%"
if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

:: ============================================
:: 检查依赖
:: ============================================
echo [1/5] 检查构建环境...

:: 检查 Python
python --version > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [错误] 未找到 Python，请先安装 Python 3.8 或更高版本
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)
echo     √ Python 已安装

:: 检查 Node.js
node --version > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [错误] 未找到 Node.js，请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo     √ Node.js 已安装

:: 检查 pip
pip --version > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [错误] 未找到 pip
    pause
    exit /b 1
)
echo     √ pip 已安装

echo.

:: ============================================
:: 安装 Python 依赖
:: ============================================
echo [2/5] 安装 Python 依赖...
cd /d "%PROJECT_DIR%backend"
pip install -r requirements.txt -q
pip install pyinstaller -q
pip install pystray Pillow -q
echo     √ Python 依赖已安装
echo.

:: ============================================
:: 构建前端
:: ============================================
echo [3/5] 构建前端应用...
cd /d "%PROJECT_DIR%frontend"

:: 设置生产环境 API URL (使用相对路径或 localhost)
set REACT_APP_API_URL=http://localhost:5000

:: 安装依赖
call npm install --silent 2>nul
if %ERRORLEVEL% neq 0 (
    echo     ! npm install 警告，尝试继续...
)

:: 构建
call npm run build --silent 2>nul
if %ERRORLEVEL% neq 0 (
    echo [错误] 前端构建失败
    pause
    exit /b 1
)
echo     √ 前端构建完成
echo.

:: ============================================
:: 打包后端
:: ============================================
echo [4/5] 打包后端应用...
cd /d "%PROJECT_DIR%"

:: 清理旧的构建
if exist "%DIST_DIR%\WorkPilot-Backend" rmdir /s /q "%DIST_DIR%\WorkPilot-Backend"

:: 使用 PyInstaller 打包后端
pyinstaller --noconfirm --clean ^
    --name=WorkPilot-Backend ^
    --onedir ^
    --console ^
    --distpath="%DIST_DIR%" ^
    --workpath="%BUILD_DIR%" ^
    --add-data="backend\prompts.py;." ^
    --add-data="backend\config.py;." ^
    --add-data="backend\database.py;." ^
    --add-data="backend\generator.py;." ^
    --add-data="backend\parser.py;." ^
    --add-data="backend\llm_client.py;." ^
    --hidden-import=flask ^
    --hidden-import=flask_cors ^
    --hidden-import=sqlite3 ^
    --hidden-import=requests ^
    --hidden-import=dotenv ^
    --hidden-import=json ^
    --hidden-import=re ^
    --hidden-import=logging ^
    --hidden-import=datetime ^
    --hidden-import=difflib ^
    backend\app.py > nul 2>&1

if %ERRORLEVEL% neq 0 (
    echo [错误] 后端打包失败
    pause
    exit /b 1
)
echo     √ 后端打包完成
echo.

:: ============================================
:: 打包主启动器
:: ============================================
echo [5/5] 打包主启动器...

:: 清理旧的构建
if exist "%DIST_DIR%\WorkPilot" rmdir /s /q "%DIST_DIR%\WorkPilot"

:: 使用 PyInstaller 打包启动器
pyinstaller --noconfirm --clean ^
    --name=WorkPilot ^
    --onedir ^
    --windowed ^
    --distpath="%DIST_DIR%" ^
    --workpath="%BUILD_DIR%" ^
    --hidden-import=tkinter ^
    --hidden-import=tkinter.ttk ^
    --hidden-import=pystray ^
    --hidden-import=PIL ^
    --hidden-import=PIL.Image ^
    --hidden-import=PIL.ImageDraw ^
    WorkPilot.py > nul 2>&1

if %ERRORLEVEL% neq 0 (
    echo [错误] 启动器打包失败
    pause
    exit /b 1
)
echo     √ 启动器打包完成
echo.

:: ============================================
:: 组装最终安装包
:: ============================================
echo [+] 组装安装包目录结构...

:: 创建目标目录
set FINAL_DIR=%OUTPUT_DIR%\WorkPilot
if exist "%FINAL_DIR%" rmdir /s /q "%FINAL_DIR%"
mkdir "%FINAL_DIR%"
mkdir "%FINAL_DIR%\backend"
mkdir "%FINAL_DIR%\www"

:: 复制启动器
xcopy /E /Y /Q "%DIST_DIR%\WorkPilot\*" "%FINAL_DIR%\" > nul

:: 复制后端
xcopy /E /Y /Q "%DIST_DIR%\WorkPilot-Backend\*" "%FINAL_DIR%\backend\" > nul

:: 复制前端
xcopy /E /Y /Q "%PROJECT_DIR%frontend\build\*" "%FINAL_DIR%\www\" > nul

:: 创建数据目录
mkdir "%FINAL_DIR%\backend\data"

echo     √ 安装包目录结构创建完成
echo.

:: ============================================
:: 完成
:: ============================================
echo ============================================
echo 构建完成！
echo ============================================
echo.
echo 输出目录: %FINAL_DIR%
echo.
echo 目录结构:
echo   WorkPilot\
echo   ├── WorkPilot.exe     (双击启动)
echo   ├── backend\          (后端服务)
echo   └── www\              (前端页面)
echo.
echo 使用方法:
echo   1. 将 WorkPilot 文件夹复制到目标电脑
echo   2. 双击 WorkPilot.exe 即可使用
echo.
echo 如需创建安装程序:
echo   1. 安装 Inno Setup (https://jrsoftware.org/isinfo.php)
echo   2. 打开 build_installer.iss
echo   3. 修改 Source 路径指向 %FINAL_DIR%
echo   4. 点击 Build -^> Compile
echo.

:: 打开输出目录
explorer "%OUTPUT_DIR%"

pause
