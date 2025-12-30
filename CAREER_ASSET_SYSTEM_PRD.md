# 个人职业资产管理系统 (Personal Career Asset Management System) - 需求文档

| 文档版本 | V1.1 |
| :--- | :--- |
| **日期** | 2025----

## 4. 开发路线图 (Roadmap)

### Phase 1: 核心重构 ✅ 已完成
1.  ✅ **数据库扩展**：新增 `projects`、`work_items`、`skills` 表（保留原有表不变）
2.  ✅ **LLM 提取器开发**：编写专门用于"信息提取"的 Prompt，支持 Few-Shot Learning
3.  ✅ **后端 API**：完整的项目/工作项/技能 CRUD 接口
4.  ✅ **前端页面**：简历积木库 + 能力成长雷达（Apple 风格 UI）

### Phase 2: 资产视图 ✅ 已完成
1.  ✅ **项目复盘页**：按 Project 聚合的视图，支持 STAR 摘要生成
2.  ✅ **技能统计页**：技能分布柱状图 + 分类筛选

### Phase 3: 长期价值 (待开发)
1.  **年度报告生成**：一键生成年度工作总结 PDF
2.  **简历导出**：导出标准 Markdown 格式简历
3.  **时间线视图**：按时间查看所有工作记录

---

## 5. 技术实现说明

### 5.1 新增文件
- `backend/database.py` - 扩展了数据库模块，新增 Career Asset 相关表和 CRUD 函数
- `backend/prompts.py` - 新增实体提取和 STAR 生成的 Prompt 模板
- `backend/generator.py` - 新增 `extract_work_items()` 和 `generate_star_summary()` 函数
- `backend/app.py` - 新增 Career Asset Management API 路由
- `frontend/src/components/CareerAssets.tsx` - 简历积木库页面组件
- `frontend/src/components/CareerAssets.css` - Apple 风格样式
- `frontend/src/components/SkillsRadar.tsx` - 能力成长雷达页面组件
- `frontend/src/components/SkillsRadar.css` - Apple 风格样式
- `frontend/src/services/api.ts` - 扩展了 API 接口定义

### 5.2 数据库表结构（实际实现）

```sql
-- 项目表
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    start_date TEXT,
    end_date TEXT,
    star_summary TEXT,
    created_at TEXT,
    updated_at TEXT
);

-- 工作项表
CREATE TABLE work_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_log_date TEXT NOT NULL,
    project_id INTEGER,
    action TEXT,
    problem TEXT,
    result_metric TEXT,
    skills_tags TEXT,
    extraction_status TEXT DEFAULT 'pending',
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);

-- 技能表
CREATE TABLE skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    count INTEGER DEFAULT 0,
    first_used_date TEXT,
    last_used_date TEXT,
    created_at TEXT,
    updated_at TEXT
);
```

### 5.3 API 端点

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| GET | `/api/projects` | 获取所有项目 |
| GET | `/api/projects/summary` | 获取项目摘要（含工作项统计） |
| GET | `/api/projects/<id>` | 获取项目详情（含工作项） |
| POST | `/api/projects` | 创建项目 |
| PUT | `/api/projects/<id>` | 更新项目 |
| DELETE | `/api/projects/<id>` | 删除项目 |
| POST | `/api/projects/<id>/star` | 生成 STAR 摘要 |
| GET | `/api/work-items` | 获取所有工作项 |
| GET | `/api/work-items/range` | 按日期范围获取工作项 |
| POST | `/api/work-items` | 创建工作项 |
| PUT | `/api/work-items/<id>` | 更新工作项 |
| DELETE | `/api/work-items/<id>` | 删除工作项 |
| POST | `/api/extract-work-items` | 智能提取工作项 |
| GET | `/api/skills` | 获取所有技能 |
| GET | `/api/skills/stats` | 获取技能统计 |* | ✅ 已实现 Phase 1 |
| **核心理念** | **私有化、长期主义、资产化** |

---

## 📋 实现进度

| 功能模块 | 状态 | 说明 |
| :--- | :--- | :--- |
| 数据库扩展 | ✅ 完成 | 新增 projects, work_items, skills 表 |
| LLM 实体提取器 | ✅ 完成 | 支持从日志中提取结构化工作项 |
| STAR 摘要生成 | ✅ 完成 | 基于工作项生成简历素材 |
| 后端 API | ✅ 完成 | 项目/工作项/技能的完整 CRUD |
| 简历积木库页面 | ✅ 完成 | Apple 风格 UI |
| 能力成长雷达页面 | ✅ 完成 | Apple 风格 UI |

---

## 1. 产品定位与核心价值

### 1.1 产品定义
这不是一个用来应付周报的生成器，而是一个**运行在本地的个人职业黑匣子**。它通过本地 LLM 持续分析你的日常工作记录，自动沉淀为**简历素材（STAR法则）**和**能力成长画像**，为你未来的晋升、跳槽或年终总结提供无可辩驳的数据资产。

### 1.2 核心价值主张
1.  **零干扰输入**：你只管按你的习惯写详细的日志，不需要填复杂的表单。
2.  **拒绝幻觉**：本地 LLM 严格基于事实进行结构化提取，绝不无中生有。
3.  **资产复利**：今天的记录，就是明年简历上最亮眼的一行字。

---

## 2. 核心功能模块设计

### 2.1 模块一：智能日志流 (Smart Log Stream) —— “只写事实”

*   **用户场景**：
    *   用户在文本框中输入：“今天主要在搞鉴权模块的重构，把原来的 Session 换成了 JWT，因为之前的并发量上来后 Redis 压力太大。测了一下，响应时间从 200ms 降到了 50ms。”
*   **功能逻辑**：
    *   **输入**：纯文本（支持 Markdown）。
    *   **本地 LLM 后处理（关键）**：
        *   不进行“扩写”，而是进行**“实体抽取”**。
        *   **提取目标**：
            *   `Project`: 鉴权模块重构
            *   `Action`: Session 迁移至 JWT
            *   `Problem`: 并发导致 Redis 压力大
            *   `Result`: 响应时间 200ms -> 50ms
            *   `Skills`: JWT, Redis, 性能优化
*   **数据存储**：
    *   原始日志保留。
    *   结构化数据存入 `work_items` 表。

### 2.2 模块二：简历积木库 (Resume Bricks) —— “STAR 自动归档”

*   **用户场景**：
    *   年底写晋升 PPT 或更新简历时，用户打开“项目视图”。
*   **功能逻辑**：
    *   **按项目聚合**：系统自动将过去 3 个月关于“鉴权模块重构”的所有日志聚合在一起。
    *   **STAR 生成**：本地 LLM 基于聚合后的事实，生成一段标准的简历描述：
        > **项目：鉴权系统重构**
        > *   **背景 (S)**：原有 Session 方案在高并发场景下导致 Redis 负载过高，影响系统稳定性。
        > *   **任务 (T)**：设计并迁移至无状态的 JWT 认证机制。
        > *   **结果 (R)**：成功上线后，API 平均响应时间由 200ms 优化至 50ms (提升 75%)，Redis 资源占用降低 40%。
*   **交付物**：
    *   一个可直接复制的“项目经历”列表。

### 2.3 模块三：能力成长雷达 (Capability Radar) —— “量化成长”

*   **用户场景**：
    *   用户想知道自己这半年是不是一直在做重复劳动，还是在某些领域有突破。
*   **功能逻辑**：
    *   **技能标签统计**：基于日志中提取的 `Skills` 标签（如 Python, 架构设计, 沟通协调）进行频次和关联度分析。
    *   **可视化展示**：
        *   **雷达图**：展示本月/本季度的技能分布重心（例如：技术深度 60%，项目管理 20%，业务理解 20%）。
        *   **趋势线**：展示某个特定技能（如“性能优化”）在过去一年的出现频率趋势。

---

## 3. 技术约束与非功能需求

### 3.1 本地化与隐私 (Local First)
*   **模型限制**：所有 AI 处理必须在本地运行（利用现有的本地 LLM 接口）。
*   **Prompt 策略**：
    *   使用 **Few-Shot Learning (少样本提示)**，在 Prompt 中给出明确的“提取范例”，严禁模型进行创造性写作，确保 **Fact-Based (基于事实)**。
    *   如果用户输入太简略（如“修了个 bug”），系统应标记为“待补充”，而不是瞎编乱造。

### 3.2 数据结构设计 (SQLite)

我们需要改造现有的数据库以支持“资产化”：

```sql
-- 1. 项目/任务维度表 (用于聚合)
CREATE TABLE projects (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE, -- 如 "鉴权模块重构"
    status TEXT, -- 进行中, 已归档
    start_date DATE,
    end_date DATE
);

-- 2. 工作项原子表 (从日志中提取的结构化数据)
CREATE TABLE work_items (
    id INTEGER PRIMARY KEY,
    raw_log_id INTEGER, -- 关联原始日志
    project_id INTEGER, -- 关联项目
    action TEXT, -- 具体做了什么
    result_metric TEXT, -- 量化结果 (如 "提升50%")
    skills_tags TEXT, -- JSON 数组: ["Redis", "JWT"]
    created_at DATE
);
```

---

## 4. 开发路线图 (Roadmap)

### Phase 1: 核心重构 (当前重点)
1.  **数据库迁移**：建立 `projects` 和 `work_items` 表。
2.  **LLM 提取器开发**：编写专门用于“信息提取”而非“生成周报”的 Prompt。
3.  **日志录入页改造**：保留大文本框，但在后台增加异步解析逻辑。

### Phase 2: 资产视图
1.  **项目复盘页**：开发按 Project 聚合的视图，展示 STAR 摘要。
2.  **技能统计页**：简单的 ECharts 图表，展示技能标签云。

### Phase 3: 长期价值
1.  **年度报告生成**：一键生成年度工作总结 PDF。
2.  **简历导出**：导出标准 Markdown 格式简历。
