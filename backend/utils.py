import os
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

load_dotenv()

def init_database():
    """初始化数据库"""
    try:
        # 连接到MySQL服务器
        connection = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            user=os.getenv("DB_USER", "root"),
            password=os.getenv("DB_PASSWORD", "123456")
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # 读取SQL文件
            with open('database/init_db.sql', 'r', encoding='utf-8') as file:
                sql_script = file.read()
            
            # 执行SQL脚本
            for result in cursor.execute(sql_script, multi=True):
                if result.with_rows:
                    print(f"产生 {result.rowcount} 行")
            
            print("数据库初始化成功")
            
    except Error as e:
        print(f"数据库初始化失败: {e}")
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    init_database()