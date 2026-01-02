#!/bin/bash

echo "========================================"
echo "启动周报与OKR助手服务"
echo "========================================"
echo ""

# 设置项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

echo "[1/3] 检查端口占用情况..."
echo ""

# 检查并停止端口5001（后端）
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "警告: 端口 5001 已被占用，将尝试停止..."
    lsof -ti:5001 | xargs kill -9 2>/dev/null
    sleep 2
fi

# 检查并停止端口5002（前端）
if lsof -Pi :5002 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "警告: 端口 5002 已被占用，将尝试停止..."
    lsof -ti:5002 | xargs kill -9 2>/dev/null
    sleep 2
fi

echo "[2/3] 启动后端服务（端口 5001）..."

# 启动后端
cd "$PROJECT_ROOT/backend"
nohup python3 app.py > backend.log 2>&1 &
BACKEND_PID=$!

echo "后端服务已在后台启动"
echo "   - 地址: http://localhost:5001"
echo "   - 日志: backend/backend.log"
echo "   - PID: $BACKEND_PID"
echo ""

# 等待后端启动
echo "   等待后端服务就绪..."
sleep 5

echo "[3/3] 启动前端服务（端口 5002）..."

# 启动前端
cd "$PROJECT_ROOT/frontend"
export PORT=5002
export BROWSER=none
nohup npm start > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "前端服务已在后台启动"
echo "   - 地址: http://localhost:5002"
echo "   - 日志: frontend/frontend.log"
echo "   - PID: $FRONTEND_PID"
echo ""

# 等待前端启动
echo "   等待前端服务就绪（约30秒）..."
sleep 30

echo "========================================"
echo "服务启动完成！"
echo "========================================"
echo ""
echo "服务信息:"
echo "   后端: http://localhost:5001 (PID: $BACKEND_PID)"
echo "   前端: http://localhost:5002 (PID: $FRONTEND_PID)"
echo ""
echo "提示:"
echo "   - 使用 ./stop_services.sh 停止所有服务"
echo "   - 服务在后台运行"
echo "   - 日志: backend/backend.log 和 frontend/frontend.log"
echo ""

# 自动打开浏览器
echo "正在打开浏览器..."
sleep 2
open http://localhost:5002

echo ""
echo "按回车键退出本窗口（服务将继续在后台运行）..."
read
