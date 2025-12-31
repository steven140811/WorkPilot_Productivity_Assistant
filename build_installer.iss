; WorkPilot 效能助手 - Inno Setup 安装脚本
; 
; 使用方法:
; 1. 首先运行 build_all.bat 构建应用
; 2. 下载并安装 Inno Setup (https://jrsoftware.org/isinfo.php)
; 3. 打开此文件并点击 Build -> Compile 生成安装程序

#define MyAppName "WorkPilot 效能助手"
#define MyAppVersion "0.1.0"
#define MyAppPublisher "WorkPilot Team"
#define MyAppURL "https://github.com/steven140811/WorkPilot_Productivity_Assistant"
#define MyAppExeName "WorkPilot.exe"

[Setup]
; 基本信息
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; 安装目录
DefaultDirName={autopf}\WorkPilot
DefaultGroupName={#MyAppName}

; 输出设置
OutputDir=installer\output
OutputBaseFilename=WorkPilot-Setup-{#MyAppVersion}
SetupIconFile=
Compression=lzma2
SolidCompression=yes

; 权限
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog

; 界面设置
WizardStyle=modern
DisableProgramGroupPage=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "创建桌面快捷方式"; GroupDescription: "附加选项:";
Name: "quicklaunchicon"; Description: "创建快速启动栏图标"; GroupDescription: "附加选项:"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode

[Files]
; 主程序和依赖
Source: "installer\output\WorkPilot\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Dirs]
; 创建数据目录（用于存储数据库）
Name: "{app}\backend\data"; Permissions: users-modify

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\卸载 {#MyAppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: quicklaunchicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "启动 {#MyAppName}"; Flags: nowait postinstall skipifsilent

[Code]
// 初始化安装
procedure InitializeWizard;
begin
  // 可以在这里添加自定义初始化代码
end;

// 安装完成后的操作
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // 安装完成后的操作
  end;
end;
