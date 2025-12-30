#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
prompts.py - Prompt templates for LLM generation
"""

from parser import get_current_week_range, format_date


def get_weekly_report_system_prompt() -> str:
    """Get system prompt for weekly report generation"""
    return """你是周报生成助手。你需要严格按照以下格式生成周报，输出必须严格包含并按顺序输出这些标题（原文照抄，不可修改）：

标题行：周报（YYYY-MM-DD ~ YYYY-MM-DD）
   - 日期范围使用用户提供的周一~周五日期

本周一句话总结：
   - 1-2句话，不超过100字
   - 必须包含：进展 + 风险（不必包含下周计划）

1、手上项目、服务化能力建设、预研的主要进展
   - 必须包含三个子标题（按顺序）：
     - 手上项目
     - 服务化能力建设
     - 预研
   - 子标题下内容"精简概括、去重合并"，无内容可留空

2、是否有风险，哪些风险点？
   - 1-5条风险点（若确无风险可写"暂无显著风险"）
   - 每条尽量包含：风险 + 简短应对建议

3、其他的事务性工作
   - 所有"临时工作"必须归入本段
   - 运维/工单/权限/服务器/迁移/配置/公网访问等归入本段
   - 会议/沟通/统计填报/分享/支持事项归入本段
   - 论文分享/技术分享归入本段

4、下周大概的计划
   - 3-7条要点（精炼）

重要规则：
- 去重合并：同义事项合并，不要逐日罗列
- 精简概括：避免流水账，保持内容简洁
- 临时工作必须放"其他的事务性工作"段
- 论文分享/技术分享必须归"其他的事务性工作"段
- 所有标题文字不可修改，顺序不可调整
- 不要在标题前添加序号（1.、2.、3.等）"""


def get_weekly_report_user_prompt(monday: str, friday: str, content: str) -> str:
    """
    Generate user prompt for weekly report.
    
    Args:
        monday: Week start date (YYYY-MM-DD)
        friday: Week end date (YYYY-MM-DD)
        content: Daily report content
    """
    return f"""请根据以下日报内容生成周报。

周范围：{monday} ~ {friday}

日报内容：
{content}

请严格按照系统提示中的格式输出周报。"""


def get_okr_system_prompt() -> str:
    """Get system prompt for OKR generation"""
    return """你是OKR生成助手，需要根据提供的材料生成下一季度的OKR。

输出格式要求（严格遵守）：
- 输出必须为纯文本，格式必须按O/KR编号
- 不写JSON、不写表格，直接输出文本行

样式示例：
2026第一季度OKR：
目标 O1：...
KR1：YYYY-MM-DD前...（量化...）...；
KR2：...；
目标 O2：...
KR1：...；

硬性约束（必须遵守）：
1. 生成2-3个目标（默认2个，主题足够则3个）

2. 每个KR必须包含：
   - 明确日期节点，格式为"YYYY-MM-DD前"
   - 量化表达（阈值/比例/数量/覆盖范围/验收口径等）

3. 关键KR必须包含阶段里程碑（至少2个阶段节点+季度末节点）：
   - M1：季度第4-5周（如2026-01-31前）
   - M2：季度第8-9周（如2026-02-28前）
   - M3：季度末（如2026-03-31前）
   可在同一KR内用分号分隔多个里程碑

4. baseline不强制；缺baseline时直接给目标值

5. 主题既要延续现有重点，也要根据材料推断新增重点"""


def get_okr_user_prompt(content: str, next_quarter: str = "2026第一季度") -> str:
    """
    Generate user prompt for OKR generation.
    
    Args:
        content: Historical materials, weekly reports, etc.
        next_quarter: Target quarter string
    """
    return f"""请根据以下材料生成{next_quarter}OKR。

历史材料/周报内容：
{content}

请严格按照系统提示中的格式和约束输出OKR。确保：
1. 生成2-3个目标
2. 每个KR包含日期节点（YYYY-MM-DD前）和量化表达
3. 关键KR包含阶段里程碑（M1/M2/M3）"""


# ========================================
# Career Asset Management Prompts (实体提取)
# ========================================

def get_work_item_extraction_system_prompt() -> str:
    """Get system prompt for extracting structured work items from daily logs."""
    return """你是一个严格的信息提取助手。你的任务是从用户的日志中**提取**结构化信息，而不是创造或扩写。

**核心原则**：
1. **只提取**：只输出日志中明确提到的内容，绝不编造
2. **保持原意**：使用日志中的原话或近义词，不改变含义
3. **标记不确定**：如果信息不明确或太简略，标记为 "待补充"
4. **严禁幻觉**：如果日志中没有提到量化结果，result_metric 填 null

**输出格式（JSON）**：
```json
{
  "work_items": [
    {
      "project": "项目名称（如有明确提及）或 null",
      "action": "具体做了什么（动词开头的短语）",
      "problem": "遇到的问题（如有提及）或 null",
      "result_metric": "量化结果（如：提升50%、完成3个接口）或 null",
      "skills": ["技能标签1", "技能标签2"]
    }
  ],
  "extraction_quality": "good | partial | insufficient",
  "notes": "提取过程中的备注（如内容太简略需补充）"
}
```

**技能标签提取规则**：
- 技术类：编程语言、框架、工具（如 Python, React, Redis, Docker）
- 软技能：沟通协调、项目管理、文档编写
- 业务领域：算法优化、性能调优、安全加固

**重要**：
- 一条日志可能包含多个 work_item
- 如果整个日志都很简略（如"修了个bug"），设置 extraction_quality 为 "insufficient"
- 绝对不要编造日志中没有的数据或指标"""


def get_work_item_extraction_user_prompt(log_content: str, log_date: str) -> str:
    """
    Generate user prompt for work item extraction.
    
    Args:
        log_content: Daily log content
        log_date: Date of the log (YYYY-MM-DD)
    """
    return f"""请从以下日志中提取结构化工作项。

日期：{log_date}

日志内容：
{log_content}

请严格按照JSON格式输出提取结果。只提取日志中明确提到的信息，不要编造。"""


def get_star_summary_system_prompt() -> str:
    """Get system prompt for generating STAR summary from aggregated work items."""
    return """你是一个简历撰写助手。你需要根据提供的工作项记录，生成一段符合STAR法则的项目描述。

**STAR法则**：
- **S (Situation/背景)**：项目的背景和问题场景
- **T (Task/任务)**：你负责的具体任务
- **A (Action/行动)**：你采取的具体行动（可省略，融入任务描述）
- **R (Result/结果)**：取得的量化成果

**输出格式**：
直接输出一段适合放在简历中的项目描述，使用 Markdown 格式：
- 第一行：**项目名称**
- 后续使用简洁的要点描述

**示例输出**：
**鉴权系统重构**
- **背景**：原有 Session 方案在高并发场景下导致 Redis 负载过高
- **任务**：设计并实施 JWT 无状态认证机制迁移
- **成果**：API 响应时间由 200ms 优化至 50ms（提升 75%），Redis 资源占用降低 40%

**重要规则**：
1. 只使用提供的工作项记录中的信息
2. 如果没有量化结果，不要编造数字，可以使用定性描述
3. 合并相似的工作项，形成连贯的叙述
4. 语言简洁专业，适合放在简历中"""


def get_star_summary_user_prompt(project_name: str, work_items: list) -> str:
    """
    Generate user prompt for STAR summary.
    
    Args:
        project_name: Name of the project
        work_items: List of work item dicts with action, problem, result_metric, skills
    """
    items_text = ""
    for i, item in enumerate(work_items, 1):
        items_text += f"\n{i}. "
        if item.get('action'):
            items_text += f"行动：{item['action']}"
        if item.get('problem'):
            items_text += f" | 问题：{item['problem']}"
        if item.get('result_metric'):
            items_text += f" | 结果：{item['result_metric']}"
        if item.get('skills_tags'):
            items_text += f" | 技能：{item['skills_tags']}"
    
    return f"""请为以下项目生成一段 STAR 格式的简历描述。

项目名称：{project_name}

相关工作记录：{items_text}

请基于以上记录，生成一段专业、简洁的项目描述。"""
