# Changelog

所有重要的变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 待发布
- 暂无

## [0.1.0] - 2025-12-31

### 🎉 初始版本

这是 WorkPilot 效能助手的首个正式发布版本。

### ✨ 新增功能

#### 核心功能
- 📅 **日报录入**：日历式界面，支持节假日显示，包含 TODO Tips 记事板
- 📋 **周报生成**：从日报一键生成周报，AI 智能分类、去重合并、提取风险点
- 🔍 **周报查询**：历史周报查询、编辑、删除功能
- 🎯 **OKR 生成**：基于历史材料智能生成季度 OKR，包含量化指标和里程碑
- 💼 **简历积木**：自动提取 STAR 格式工作成果，积累职业资产
- 📊 **能力雷达**：技能分布可视化，AI 智能分类

#### 配置管理
- ⚙️ **LLM 配置**：Web 界面配置 LLM API，支持测试连接
- 🔄 **配置持久化**：配置保存到数据库，重启后自动加载
- 📡 **状态监控**：实时显示 LLM 配置状态

#### 用户体验
- 🪟 **Windows 安装包**：一键安装，无需配置开发环境
- 🔽 **系统托盘**：支持最小化到系统托盘，后台运行
- 📤 **多格式导出**：支持导出为 CSV、Markdown、TXT 格式
- 🎨 **Apple 风格 UI**：现代化的用户界面设计
- 🔔 **删除确认**：统一的 Apple 风格删除确认弹窗

#### 技术特性
- 💾 **本地数据库**：SQLite 存储，数据安全可靠
- 🔒 **数据隐私**：所有数据本地存储，不上传云端
- 🌐 **兼容性**：支持多种 OpenAI 兼容的 LLM API
- 📝 **日志记录**：详细的操作日志，便于问题排查

### 🛠️ 技术栈
- **前端**: React 18 + TypeScript
- **后端**: Flask + Python 3.11
- **数据库**: SQLite 3
- **LLM**: OpenAI-compatible API
- **打包**: PyInstaller + Inno Setup

### 📦 部署方式
- Windows 安装包（推荐）
- Docker Compose
- 一键启动脚本（Windows）
- 手动部署

### 📖 文档
- 中文完整文档（README_CN.md）
- 英文文档（README.md）
- 数据迁移指南
- Release 发布指南
- 构建指南（BUILD_GUIDE.md）

### 🐛 已知问题
- 首次启动可能需要 10-15 秒初始化数据库
- 部分杀毒软件可能误报 exe 文件（属正常现象，可添加信任）
- LLM API URL 需手动输入（不支持自动发现）

### 🔜 未来计划
- [ ] 支持更多导出格式（PDF、Word）
- [ ] 移动端支持
- [ ] 团队协作功能
- [ ] 数据加密
- [ ] 自动备份到云端

---

## 版本对比

### [0.1.0] vs 未来版本
- 初始版本，建立核心功能基础

---

## 贡献者

感谢以下贡献者：
- @steven140811 - 项目创建者和主要开发者

---

[Unreleased]: https://github.com/steven140811/WorkPilot/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/steven140811/WorkPilot/releases/tag/v0.1.0
