import os
import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv

load_dotenv()

class Database:
    def __init__(self):
        self.connection = None
        self.connect()
    
    def connect(self):
        try:
            self.connection = mysql.connector.connect(
                host=os.getenv("DB_HOST", "localhost"),
                user=os.getenv("DB_USER", "root"),
                password=os.getenv("DB_PASSWORD", "123456"),
                database=os.getenv("DB_NAME", "studychat")
            )
            if self.connection.is_connected():
                print("成功连接到MySQL数据库")
        except Error as e:
            print(f"连接数据库时出错: {e}")
    
    def disconnect(self):
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("数据库连接已关闭")
    
    def execute_query(self, query, params=None):
        cursor = self.connection.cursor(dictionary=True)
        try:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            if query.strip().upper().startswith(('INSERT', 'UPDATE', 'DELETE')):
                self.connection.commit()
                return cursor.lastrowid
            else:
                result = cursor.fetchall()
                return result
        except Error as e:
            print(f"执行查询时出错: {e}")
            self.connection.rollback()
            return None
        finally:
            cursor.close()
    
    def execute_many(self, query, params_list):
        cursor = self.connection.cursor()
        try:
            cursor.executemany(query, params_list)
            self.connection.commit()
            return cursor.rowcount
        except Error as e:
            print(f"批量执行查询时出错: {e}")
            self.connection.rollback()
            return None
        finally:
            cursor.close()

# 创建数据库实例
db = Database()