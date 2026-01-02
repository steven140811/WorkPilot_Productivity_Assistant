#!/bin/bash

echo "========================================"
echo "停止周报与OKR助手服务"
echo "========================================"
echo ""

echo "[1/3] 查找并停止后端服务（端口 5001）..."

# 停止端口5001的进程
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    PIDS=$(lsof -ti:5001)
    for PID in $PIDS; do
        echo "   - 正在停止进程 PID: $PID"
        kill -9 $PID 2>/dev/null
    done
    echo "   后端服务已停止"
else
    echo "   后端服务未运行"
fi
echo ""

echo "[2/3] 查找并停止前端服务（端口 5002）..."

# 停止端口5002的进程
if lsof -Pi :5002 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    PIDS=$(lsof -ti:5002)
    for PID in $PIDS; do
        echo "   - 正在停止进程 PID: $PID"
        kill -9 $PID 2>/dev/null
    done
    echo "   前端服务已停止"
else
    echo "   前端服务未运行"
fi
echo ""

echo "[3/3] 清理残留的进程..."

# 停止所有包含app.py的Python进程
BACKEND_PIDS=$(ps aux | grep "[p]ython.*app.py" | awk '{print $2}')
if [ -n "$BACKEND_PIDS" ]; then
    for PID in $BACKEND_PIDS; do
        echo "   - 停止 Python 进程 PID: $PID"
        kill -9 $PID 2>/dev/null
    done
fi

# 停止所有包含react-scripts的Node进程
FRONTEND_PIDS=$(ps aux | grep "[n]ode.*react-scripts" | awk '{print $2}')
if [ -n "$FRONTEND_PIDS" ]; then
    for PID in $FRONTEND_PIDS; do
        echo "   - 停止 Node 进程 PID: $PID"
        kill -9 $PID 2>/dev/null
    done
fi

echo "   清理完成"
echo ""

echo "========================================"
echo "所有服务已停止！"
echo "========================================"
echo ""
echo "提示:"
echo "   - 使用 ./start_services.sh 重新启动服务"
echo ""

echo "按回车键退出..."
read
