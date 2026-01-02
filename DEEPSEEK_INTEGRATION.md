# DeepSeek API 集成说明

## 概述

WorkPilot 现在支持直接集成 DeepSeek API,使用 OpenAI 客户端库进行调用。

## 配置方式

### 方式 1: 使用 DeepSeek API (推荐)

在 `.env` 文件中配置:

```bash
# DeepSeek API 配置
DEEPSEEK_API_KEY=your-deepseek-api-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

### 方式 2: 使用通用 LLM API

```bash
# 通用 LLM 配置
LLM_API_URL=https://your-llm-api-url/v1
LLM_API_KEY=your-api-key-here
LLM_MODEL=your-model-name
```

## 配置优先级

系统按以下优先级选择 LLM 配置:

1. **数据库配置** (通过前端设置页面配置)
2. **DeepSeek API 配置** (环境变量 `DEEPSEEK_API_KEY`)
3. **通用 LLM 配置** (环境变量 `LLM_API_URL` 和 `LLM_API_KEY`)

## 示例代码

系统内部使用 DeepSeek API 的方式如下:

```python
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get('DEEPSEEK_API_KEY'),
    base_url="https://api.deepseek.com"
)

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "system", "content": "You are a helpful assistant"},
        {"role": "user", "content": "Hello"},
    ],
    stream=False
)

print(response.choices[0].message.content)
```

## 安装依赖

DeepSeek 集成需要 `openai` 库:

```bash
cd backend
pip install -r requirements.txt
```

## 特性

- ✅ 支持 OpenAI 客户端库调用
- ✅ 自动重试机制 (可配置重试次数)
- ✅ 超时控制
- ✅ 指数退避重试策略
- ✅ 详细的日志记录
- ✅ 向后兼容原有的 requests 调用方式

## 故障排除

如果遇到问题:

1. 确认 `openai` 库已安装: `pip show openai`
2. 检查 API key 是否正确
3. 查看后端日志以获取详细错误信息
4. 确认网络连接正常

## 相关文件

- `backend/config.py` - 配置管理
- `backend/llm_client.py` - LLM 客户端实现
- `backend/requirements.txt` - Python 依赖
- `.env.example` - 配置模板
