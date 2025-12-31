#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WorkPilot 启动器
用于启动后端服务和打开前端页面
"""

import os
import sys
import subprocess
import threading
import time
import webbrowser
import socket
import logging
from pathlib import Path

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 配置
BACKEND_PORT = 5000
FRONTEND_PORT = 3000
MAX_WAIT_TIME = 30  # 最大等待时间（秒）


def get_app_dir():
    """获取应用程序目录"""
    if getattr(sys, 'frozen', False):
        # 打包后的可执行文件
        return Path(sys.executable).parent
    else:
        # 开发环境
        return Path(__file__).parent


def is_port_open(port: int) -> bool:
    """检查端口是否开放"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('127.0.0.1', port))
        sock.close()
        return result == 0
    except:
        return False


def wait_for_port(port: int, timeout: int = 30) -> bool:
    """等待端口开放"""
    start_time = time.time()
    while time.time() - start_time < timeout:
        if is_port_open(port):
            return True
        time.sleep(0.5)
    return False


def start_backend():
    """启动后端服务"""
    app_dir = get_app_dir()
    backend_dir = app_dir / 'backend'
    
    if not backend_dir.exists():
        # 如果是打包环境，后端在同一目录
        backend_dir = app_dir
    
    # 检查是否已经有后端在运行
    if is_port_open(BACKEND_PORT):
        logger.info("后端服务已在运行")
        return None
    
    # 设置环境变量
    env = os.environ.copy()
    env['PORT'] = str(BACKEND_PORT)
    
    # 启动后端
    if getattr(sys, 'frozen', False):
        # 打包环境
        backend_exe = app_dir / 'backend' / 'app.exe'
        if backend_exe.exists():
            logger.info(f"启动后端: {backend_exe}")
            process = subprocess.Popen(
                [str(backend_exe)],
                cwd=str(backend_dir),
                env=env,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
            )
            return process
    else:
        # 开发环境
        python_exe = sys.executable
        app_py = backend_dir / 'app.py'
        if app_py.exists():
            logger.info(f"启动后端: {app_py}")
            process = subprocess.Popen(
                [python_exe, str(app_py)],
                cwd=str(backend_dir),
                env=env,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0
            )
            return process
    
    logger.error("找不到后端程序")
    return None


def start_frontend():
    """启动前端服务"""
    app_dir = get_app_dir()
    frontend_dir = app_dir / 'frontend'
    
    if not frontend_dir.exists():
        frontend_dir = app_dir / 'www'
    
    # 检查是否有静态前端文件
    static_index = frontend_dir / 'build' / 'index.html'
    if not static_index.exists():
        static_index = frontend_dir / 'index.html'
    
    if static_index.exists():
        # 使用内置的 HTTP 服务器提供静态文件
        from http.server import HTTPServer, SimpleHTTPRequestHandler
        
        class CustomHandler(SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=str(static_index.parent), **kwargs)
            
            def log_message(self, format, *args):
                pass  # 静默日志
        
        server = HTTPServer(('127.0.0.1', FRONTEND_PORT), CustomHandler)
        
        def serve():
            server.serve_forever()
        
        thread = threading.Thread(target=serve, daemon=True)
        thread.start()
        logger.info(f"前端服务已启动在端口 {FRONTEND_PORT}")
        return server
    
    return None


def open_browser():
    """打开浏览器"""
    url = f"http://localhost:{FRONTEND_PORT}"
    logger.info(f"正在打开浏览器: {url}")
    webbrowser.open(url)


def main():
    """主函数"""
    logger.info("=" * 50)
    logger.info("WorkPilot 效能助手 启动中...")
    logger.info("=" * 50)
    
    # 启动后端
    logger.info("正在启动后端服务...")
    backend_process = start_backend()
    
    # 等待后端启动
    if not wait_for_port(BACKEND_PORT, MAX_WAIT_TIME):
        logger.error(f"后端服务启动失败（端口 {BACKEND_PORT} 未响应）")
        if backend_process:
            backend_process.terminate()
        return 1
    
    logger.info("后端服务已启动")
    
    # 启动前端
    logger.info("正在启动前端服务...")
    frontend_server = start_frontend()
    
    if frontend_server:
        # 等待前端启动
        time.sleep(1)
        
        # 打开浏览器
        open_browser()
        
        logger.info("=" * 50)
        logger.info("WorkPilot 已启动！")
        logger.info(f"前端地址: http://localhost:{FRONTEND_PORT}")
        logger.info(f"后端地址: http://localhost:{BACKEND_PORT}")
        logger.info("关闭此窗口将停止服务")
        logger.info("=" * 50)
        
        try:
            # 保持运行
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("正在关闭服务...")
    else:
        # 没有前端静态文件，直接打开后端
        open_browser_url = f"http://localhost:{BACKEND_PORT}"
        webbrowser.open(open_browser_url)
        
        logger.info("=" * 50)
        logger.info("WorkPilot 后端已启动！")
        logger.info(f"地址: {open_browser_url}")
        logger.info("关闭此窗口将停止服务")
        logger.info("=" * 50)
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("正在关闭服务...")
    
    # 清理
    if backend_process:
        backend_process.terminate()
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
