import os
import sys
import subprocess
import threading
import time
from pathlib import Path

def run_command(command, cwd=None):
    """运行命令并输出结果"""
    process = subprocess.Popen(
        command,
        shell=True,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # 实时输出
    while True:
        output = process.stdout.readline()
        if output == '' and process.poll() is not None:
            break
        if output:
            print(output.strip())
    
    # 检查错误
    stderr = process.stderr.read()
    if stderr:
        print(f"错误: {stderr.strip()}")
    
    return process.returncode

def install_dependencies():
    """安装Python依赖"""
    print("正在安装Python依赖...")
    return run_command("pip install -r requirements.txt")

def init_database():
    """初始化数据库"""
    print("正在初始化数据库...")
    return run_command("python init_database.py")

def start_backend():
    """启动后端服务"""
    print("正在启动后端服务...")
    os.chdir("backend")
    return run_command("uvicorn main:app --reload --host 0.0.0.0 --port 8000")

def main():
    """主函数"""
    print("=== StudyChat 启动脚本 ===")
    
    # 检查Python版本
    if sys.version_info < (3, 8):
        print("错误: 需要Python 3.8或更高版本")
        return
    
    # 安装依赖
    if install_dependencies() != 0:
        print("安装依赖失败")
        return
    
    # 初始化数据库
    if init_database() != 0:
        print("初始化数据库失败")
        return
    
    print("\n=== 启动成功 ===")
    print("后端服务已启动在 http://localhost:8000")
    print("API文档: http://localhost:8000/docs")
    print("前端页面: 请在浏览器中打开 frontend/index.html")
    print("\n按 Ctrl+C 停止服务")
    
    try:
        start_backend()
    except KeyboardInterrupt:
        print("\n服务已停止")

if __name__ == "__main__":
    main()