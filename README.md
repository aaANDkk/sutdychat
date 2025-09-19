# StudyChat - 学习聊天室

一个简单的学习聊天室应用，用户可以注册、登录、添加好友、聊天并赚取硬币兑换奖品。

## 功能特点

- 用户注册和登录
- 好友管理（添加/删除好友）
- 聊天功能（每次聊天获得 1 个硬币）
- 奖品兑换系统
- 简约的前端设计，以黄色为强调色

## 技术栈

- 后端: Python,FastAPI
- 前端: HTML, CSS, JavaScript
- 数据库: MySQL

## 项目结构

```
studychat/
├── backend/          # FastAPI后端代码
├── frontend/         # 前端代码
├── database/         # 数据库相关文件
├── requirements.txt  # Python依赖
└── .env             # 环境变量
```

## 安装和运行

1. 安装依赖:

```bash
pip install -r requirements.txt
```

2. 配置数据库:

- 创建 MySQL 数据库 `studychat`
- 更新 `.env` 文件中的数据库连接信息

3. 运行后端:

```bash
cd backend
uvicorn main:app --reload
```

4. 打开前端:

- 在浏览器中打开 `http://localhost:8000`
