# Release 发布指南

本文档说明如何创建 WorkPilot 的 GitHub Release 并上传安装包。

## 准备工作

### 1. 构建安装包

首先确保已构建最新的安装包：

```bash
# 在项目根目录执行
.\build_all.bat
```

构建完成后，安装包位于：
```
installer\output\WorkPilot-Setup-0.1.0.exe
```

### 2. 测试安装包

在发布前，务必测试安装包：
- 在干净的 Windows 环境中安装
- 验证所有功能正常工作
- 测试 LLM 配置和数据持久化

## 创建 GitHub Release

### 方法一：通过 GitHub 网页界面（推荐）

1. **访问 Releases 页面**
   - 打开项目 GitHub 页面
   - 点击右侧的 "Releases"
   - 点击 "Create a new release"

2. **设置版本标签**
   - Tag version: `v0.1.0`（遵循语义化版本）
   - Target: `main` 分支

3. **填写 Release 信息**
   
   **Release title**: `WorkPilot v0.1.0 - 初始版本`
   
   **Description** (示例):
   ```markdown
   ## 🎉 WorkPilot v0.1.0 - 初始发布
   
   这是 WorkPilot 效能助手的首个正式版本，提供完整的日报/周报/OKR 管理功能。
   
   ### ✨ 主要功能
   - 📅 日历式日报录入，支持节假日显示
   - 🤖 AI 智能周报生成
   - 🎯 OKR 目标规划
   - 💼 简历积木（STAR 格式）
   - 📊 能力雷达可视化
   - ⚙️ LLM 配置管理
   
   ### 🚀 安装方式
   
   #### Windows 用户（推荐）
   1. 下载 `WorkPilot-Setup-0.1.0.exe`
   2. 双击运行安装程序
   3. 按向导完成安装
   4. 启动后在"设置"页面配置 LLM API
   
   ### 📦 文件说明
   - `WorkPilot-Setup-0.1.0.exe` - Windows 安装包（约 100MB）
   - `Source code (zip)` - 源代码压缩包（自动生成）
   - `Source code (tar.gz)` - 源代码压缩包（自动生成）
   
   ### 🔧 技术栈
   - Frontend: React + TypeScript
   - Backend: Flask + Python
   - LLM: OpenAI-compatible API
   - Database: SQLite
   
   ### 📝 系统要求
   - Windows 10/11 (64-bit)
   - 无需安装 Python 或 Node.js
   
   ### 🐛 已知问题
   - 首次启动可能需要 10-15 秒初始化
   - 部分杀毒软件可能误报（属正常，可信任）
   
   ### 📖 文档
   - [中文文档](README_CN.md)
   - [English Docs](README.md)
   - [数据迁移指南](README_CN.md#-数据迁移指南)
   
   ### 🙏 致谢
   感谢所有测试用户的反馈和建议！
   ```

4. **上传安装包**
   - 拖拽或点击上传 `WorkPilot-Setup-0.1.0.exe`
   - 等待上传完成

5. **发布**
   - 勾选 "Set as the latest release"
   - 点击 "Publish release"

### 方法二：通过 GitHub CLI

如果已安装 GitHub CLI：

```bash
# 创建 Release 并上传文件
gh release create v0.1.0 \
  installer\output\WorkPilot-Setup-0.1.0.exe \
  --title "WorkPilot v0.1.0 - 初始版本" \
  --notes "详见 CHANGELOG.md" \
  --latest
```

## Release 版本号规范

遵循 [语义化版本 2.0.0](https://semver.org/lang/zh-CN/)：

- **主版本号（Major）**: 不兼容的 API 修改
- **次版本号（Minor）**: 向下兼容的功能性新增
- **修订号（Patch）**: 向下兼容的问题修正

示例：
- `v0.1.0` - 初始版本
- `v0.2.0` - 添加新功能（如导出 PDF）
- `v0.2.1` - 修复 Bug
- `v1.0.0` - 第一个稳定版本

## 版本更新流程

每次发布新版本时：

1. **更新版本号**
   - 修改 `build_installer.iss` 中的 `MyAppVersion`
   - 修改 `frontend/package.json` 中的 `version`
   - 修改 `frontend/src/App.tsx` 中的 `APP_VERSION`

2. **更新 CHANGELOG**
   - 创建 `CHANGELOG.md` 记录每个版本的变更

3. **重新构建**
   ```bash
   .\build_all.bat
   ```

4. **提交代码**
   ```bash
   git add .
   git commit -m "Release v0.x.x"
   git push
   ```

5. **创建 Release**
   - 按照上述步骤创建 GitHub Release

## 自动化发布（可选）

可以使用 GitHub Actions 自动化构建和发布流程。创建 `.github/workflows/release.yml`：

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Build
        run: .\build_all.bat
      
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: installer\output\*.exe
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 常见问题

### Q: 安装包上传失败？
A: GitHub Release 单个文件限制 2GB，如果超过可以考虑压缩或分割。

### Q: 如何撤回 Release？
A: 在 Releases 页面点击对应版本的 "Delete" 按钮。

### Q: 可以编辑已发布的 Release 吗？
A: 可以，但不建议修改已发布的安装包，应该发布新版本。

## 检查清单

发布前确认：

- [ ] 版本号已更新（所有相关文件）
- [ ] 安装包已构建并测试
- [ ] CHANGELOG 已更新
- [ ] README 中的功能描述准确
- [ ] 截图和文档最新
- [ ] 所有代码已提交到 main 分支
- [ ] 创建了版本标签
- [ ] Release 描述清晰完整
- [ ] 安装包已上传
- [ ] 设置为 latest release
