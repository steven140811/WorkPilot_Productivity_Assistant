#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WorkPilot 独立启动器
用于一键启动整个应用（包括后端服务和前端页面）
可以通过 PyInstaller 打包成单个 exe 文件
支持最小化到系统托盘
"""

import os
import sys
import subprocess
import threading
import time
import webbrowser
import socket
import http.server
import socketserver
import logging
import tkinter as tk
from tkinter import ttk, messagebox
from pathlib import Path

# 尝试导入系统托盘支持
try:
    import pystray
    from PIL import Image, ImageDraw
    TRAY_SUPPORTED = True
except ImportError:
    TRAY_SUPPORTED = False
    print("提示: 安装 pystray 和 Pillow 可启用系统托盘功能")

# 配置
BACKEND_PORT = 5000
FRONTEND_PORT = 3000
APP_NAME = "WorkPilot 效能助手"

class WorkPilotLauncher:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title(APP_NAME)
        self.root.geometry("400x300")
        self.root.resizable(False, False)
        
        # 居中显示
        self.center_window()
        
        # 状态变量
        self.backend_process = None
        self.frontend_server = None
        self.is_running = False
        
        # 系统托盘相关
        self.tray_icon = None
        self.is_minimized_to_tray = False
        
        # 创建界面
        self.create_ui()
        
        # 绑定最小化事件
        self.root.bind("<Unmap>", self.on_minimize)
        
        # 自动启动
        self.root.after(500, self.auto_start)
        
    def center_window(self):
        """将窗口居中"""
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = (self.root.winfo_screenwidth() // 2) - (width // 2)
        y = (self.root.winfo_screenheight() // 2) - (height // 2)
        self.root.geometry(f'{width}x{height}+{x}+{y}')
    
    def create_ui(self):
        """创建用户界面"""
        # 主框架
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # 标题
        title_label = ttk.Label(
            main_frame, 
            text="🚀 " + APP_NAME,
            font=("Microsoft YaHei", 16, "bold")
        )
        title_label.pack(pady=(0, 20))
        
        # 状态区域
        status_frame = ttk.LabelFrame(main_frame, text="服务状态", padding="10")
        status_frame.pack(fill=tk.X, pady=(0, 15))
        
        # 后端状态
        backend_frame = ttk.Frame(status_frame)
        backend_frame.pack(fill=tk.X, pady=2)
        ttk.Label(backend_frame, text="后端服务:").pack(side=tk.LEFT)
        self.backend_status = ttk.Label(backend_frame, text="未启动", foreground="gray")
        self.backend_status.pack(side=tk.RIGHT)
        
        # 前端状态
        frontend_frame = ttk.Frame(status_frame)
        frontend_frame.pack(fill=tk.X, pady=2)
        ttk.Label(frontend_frame, text="前端服务:").pack(side=tk.LEFT)
        self.frontend_status = ttk.Label(frontend_frame, text="未启动", foreground="gray")
        self.frontend_status.pack(side=tk.RIGHT)
        
        # 进度条
        self.progress = ttk.Progressbar(main_frame, mode="indeterminate")
        self.progress.pack(fill=tk.X, pady=(0, 15))
        
        # 消息标签
        self.message_label = ttk.Label(
            main_frame, 
            text="正在初始化...",
            font=("Microsoft YaHei", 10)
        )
        self.message_label.pack(pady=(0, 15))
        
        # 按钮区域
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X)
        
        self.open_btn = ttk.Button(
            button_frame, 
            text="打开应用",
            command=self.open_browser,
            state=tk.DISABLED
        )
        self.open_btn.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(0, 5))
        
        self.stop_btn = ttk.Button(
            button_frame, 
            text="停止服务",
            command=self.stop_services
        )
        self.stop_btn.pack(side=tk.RIGHT, expand=True, fill=tk.X, padx=(5, 0))
        
        # 关闭窗口事件
        self.root.protocol("WM_DELETE_WINDOW", self.on_closing)
    
    def get_app_dir(self):
        """获取应用程序目录"""
        if getattr(sys, 'frozen', False):
            return Path(sys.executable).parent
        else:
            return Path(__file__).parent
    
    def is_port_open(self, port: int) -> bool:
        """检查端口是否开放"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('127.0.0.1', port))
            sock.close()
            return result == 0
        except:
            return False
    
    def update_status(self, message: str):
        """更新状态消息"""
        self.message_label.config(text=message)
        self.root.update()
    
    def auto_start(self):
        """自动启动服务"""
        self.progress.start()
        threading.Thread(target=self.start_services, daemon=True).start()
    
    def start_services(self):
        """启动所有服务"""
        try:
            # 启动后端
            self.update_status("正在启动后端服务...")
            self.start_backend()
            
            # 等待后端启动
            for i in range(30):
                if self.is_port_open(BACKEND_PORT):
                    break
                time.sleep(0.5)
            
            if self.is_port_open(BACKEND_PORT):
                self.backend_status.config(text="运行中 ✓", foreground="green")
            else:
                self.backend_status.config(text="启动失败 ✗", foreground="red")
                self.update_status("后端启动失败")
                self.progress.stop()
                return
            
            # 启动前端
            self.update_status("正在启动前端服务...")
            self.start_frontend()
            time.sleep(1)
            
            if self.is_port_open(FRONTEND_PORT):
                self.frontend_status.config(text="运行中 ✓", foreground="green")
            else:
                # 前端服务未能启动，直接使用后端
                self.frontend_status.config(text="(使用后端)", foreground="orange")
            
            self.is_running = True
            self.progress.stop()
            self.open_btn.config(state=tk.NORMAL)
            self.update_status("服务已启动，点击\"打开应用\"访问")
            
            # 自动打开浏览器
            self.root.after(1000, self.open_browser)
            
        except Exception as e:
            self.progress.stop()
            self.update_status(f"启动失败: {str(e)}")
            messagebox.showerror("错误", f"服务启动失败:\n{str(e)}")
    
    def start_backend(self):
        """启动后端服务"""
        app_dir = self.get_app_dir()
        
        # 检查是否已经有后端在运行
        if self.is_port_open(BACKEND_PORT):
            return
        
        # 设置环境变量
        env = os.environ.copy()
        env['PORT'] = str(BACKEND_PORT)
        
        # 查找后端程序
        if getattr(sys, 'frozen', False):
            # 打包环境
            backend_exe = app_dir / 'backend' / 'WorkPilot-Backend.exe'
            if backend_exe.exists():
                self.backend_process = subprocess.Popen(
                    [str(backend_exe)],
                    cwd=str(app_dir / 'backend'),
                    env=env,
                    creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
        else:
            # 开发环境
            backend_dir = app_dir / 'backend'
            app_py = backend_dir / 'app.py'
            if app_py.exists():
                self.backend_process = subprocess.Popen(
                    [sys.executable, str(app_py)],
                    cwd=str(backend_dir),
                    env=env,
                    creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
    
    def start_frontend(self):
        """启动前端静态文件服务"""
        app_dir = self.get_app_dir()
        
        # 查找前端文件
        www_dir = app_dir / 'www'
        if not www_dir.exists():
            www_dir = app_dir / 'frontend' / 'build'
        
        if not www_dir.exists() or not (www_dir / 'index.html').exists():
            return
        
        # 启动简单的 HTTP 服务器
        class QuietHandler(http.server.SimpleHTTPRequestHandler):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, directory=str(www_dir), **kwargs)
            
            def log_message(self, format, *args):
                pass  # 禁用日志
        
        try:
            self.frontend_server = socketserver.TCPServer(
                ("127.0.0.1", FRONTEND_PORT), 
                QuietHandler
            )
            
            def serve():
                self.frontend_server.serve_forever()
            
            thread = threading.Thread(target=serve, daemon=True)
            thread.start()
        except Exception as e:
            print(f"前端服务启动失败: {e}")
    
    def open_browser(self):
        """打开浏览器"""
        if self.is_port_open(FRONTEND_PORT):
            url = f"http://localhost:{FRONTEND_PORT}"
        else:
            url = f"http://localhost:{BACKEND_PORT}"
        webbrowser.open(url)
    
    def stop_services(self):
        """停止所有服务"""
        self.update_status("正在停止服务...")
        
        # 停止后端
        if self.backend_process:
            self.backend_process.terminate()
            self.backend_process = None
        
        # 停止前端
        if self.frontend_server:
            self.frontend_server.shutdown()
            self.frontend_server = None
        
        self.backend_status.config(text="已停止", foreground="gray")
        self.frontend_status.config(text="已停止", foreground="gray")
        self.is_running = False
        self.open_btn.config(state=tk.DISABLED)
        self.update_status("服务已停止")
    
    def on_closing(self):
        """窗口关闭事件"""
        if self.is_running:
            if messagebox.askokcancel("确认", "关闭窗口将停止所有服务，确定要退出吗？"):
                self.quit_app()
        else:
            self.quit_app()
    
    def on_minimize(self, event):
        """窗口最小化事件 - 最小化到系统托盘"""
        if event.widget == self.root and self.root.state() == 'iconic':
            if TRAY_SUPPORTED and self.is_running:
                self.hide_to_tray()
    
    def create_tray_icon_image(self):
        """创建托盘图标图像"""
        # 创建一个简单的图标 (64x64)
        size = 64
        image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        
        # 绘制一个蓝色圆形背景
        draw.ellipse([4, 4, size-4, size-4], fill=(59, 130, 246, 255))
        
        # 绘制白色 "W" 字母
        draw.text((16, 12), "W", fill=(255, 255, 255, 255))
        
        return image
    
    def hide_to_tray(self):
        """隐藏窗口到系统托盘"""
        if not TRAY_SUPPORTED:
            return
        
        self.root.withdraw()  # 隐藏窗口
        self.is_minimized_to_tray = True
        
        if self.tray_icon is None:
            # 创建托盘图标
            icon_image = self.create_tray_icon_image()
            
            menu = pystray.Menu(
                pystray.MenuItem("打开主界面", self.show_from_tray, default=True),
                pystray.MenuItem("打开浏览器", self.open_browser),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem("退出", self.quit_from_tray)
            )
            
            self.tray_icon = pystray.Icon(
                "workpilot",
                icon_image,
                APP_NAME + " - 运行中",
                menu
            )
            
            # 在新线程中运行托盘图标
            threading.Thread(target=self.tray_icon.run, daemon=True).start()
    
    def show_from_tray(self, icon=None, item=None):
        """从系统托盘恢复窗口"""
        self.is_minimized_to_tray = False
        self.root.after(0, self._restore_window)
    
    def _restore_window(self):
        """恢复窗口显示"""
        self.root.deiconify()  # 显示窗口
        self.root.state('normal')
        self.root.lift()  # 提升到最前
        self.root.focus_force()  # 获取焦点
    
    def quit_from_tray(self, icon=None, item=None):
        """从托盘退出应用"""
        if self.tray_icon:
            self.tray_icon.stop()
            self.tray_icon = None
        self.root.after(0, self.quit_app)
    
    def quit_app(self):
        """完全退出应用"""
        self.stop_services()
        if self.tray_icon:
            self.tray_icon.stop()
            self.tray_icon = None
        self.root.destroy()
    
    def run(self):
        """运行应用"""
        self.root.mainloop()


def main():
    """主函数"""
    app = WorkPilotLauncher()
    app.run()


if __name__ == '__main__':
    main()
