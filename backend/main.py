from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from datetime import timedelta
from typing import List
import os

from database import db
from models import (
    UserCreate, UserResponse, UserLogin, Token,
    FriendBase, FriendResponse,
    MessageBase, MessageResponse,
    CoinRecordBase, CoinRecordResponse,
    PrizeBase, PrizeResponse
)
from auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_active_user, ACCESS_TOKEN_EXPIRE_MINUTES
)

app = FastAPI(title="StudyChat API", description="学习聊天室API")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置为具体的前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件目录
app.mount("/static", StaticFiles(directory="../frontend"), name="static")
app.mount("/images", StaticFiles(directory="../frontend/images"), name="images")

# 根路径返回前端页面
@app.get("/")
async def read_index():
    """返回前端首页"""
    return FileResponse('../frontend/index.html')

# 用户认证相关API
@app.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    """用户注册"""
    # 检查用户名是否已存在
    existing_user = db.execute_query("SELECT * FROM users WHERE username = %s", (user.username,))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    
    # 检查邮箱是否已存在
    existing_email = db.execute_query("SELECT * FROM users WHERE email = %s", (user.email,))
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="邮箱已被使用"
        )
    
    # 创建新用户
    hashed_password = get_password_hash(user.password)
    query = """
    INSERT INTO users (username, password, email) 
    VALUES (%s, %s, %s)
    """
    user_id = db.execute_query(query, (user.username, hashed_password, user.email))
    
    # 获取新创建的用户信息
    new_user = db.execute_query("SELECT * FROM users WHERE id = %s", (user_id,))
    return new_user[0]

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """用户登录获取访问令牌"""
    # 查找用户
    user = db.execute_query("SELECT * FROM users WHERE username = %s", (form_data.username,))
    if not user or not verify_password(form_data.password, user[0]["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 创建访问令牌
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user[0]["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user = Depends(get_current_active_user)):
    """获取当前用户信息"""
    return current_user

@app.get("/users/username/{username}", response_model=UserResponse)
async def get_user_by_username(username: str, current_user = Depends(get_current_active_user)):
    """根据用户名获取用户信息"""
    user = db.execute_query("SELECT * FROM users WHERE username = %s", (username,))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    return user[0]

# 好友管理API
@app.post("/friends", response_model=FriendResponse)
async def add_friend(friend: FriendBase, current_user = Depends(get_current_active_user)):
    """添加好友"""
    # 检查是否已经是好友
    existing_friend = db.execute_query(
        "SELECT * FROM friends WHERE user_id = %s AND friend_id = %s",
        (friend.user_id, friend.friend_id)
    )
    if existing_friend:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="已经是好友关系"
        )
    
    # 检查好友是否存在
    friend_exists = db.execute_query("SELECT * FROM users WHERE id = %s", (friend.friend_id,))
    if not friend_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    
    # 添加好友关系
    query = """
    INSERT INTO friends (user_id, friend_id) 
    VALUES (%s, %s)
    """
    friend_id = db.execute_query(query, (friend.user_id, friend.friend_id))
    
    # 获取新创建的好友关系
    new_friend = db.execute_query("SELECT * FROM friends WHERE id = %s", (friend_id,))
    return new_friend[0]

@app.delete("/friends/{friend_id}")
async def delete_friend(friend_id: int, current_user = Depends(get_current_active_user)):
    """删除好友"""
    # 检查好友关系是否存在
    existing_friend = db.execute_query(
        "SELECT * FROM friends WHERE user_id = %s AND friend_id = %s",
        (current_user["id"], friend_id)
    )
    if not existing_friend:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="好友关系不存在"
        )
    
    # 删除好友关系
    db.execute_query(
        "DELETE FROM friends WHERE user_id = %s AND friend_id = %s",
        (current_user["id"], friend_id)
    )
    return {"message": "好友已删除"}

@app.get("/friends", response_model=List[UserResponse])
async def get_friends(current_user = Depends(get_current_active_user)):
    """获取好友列表"""
    query = """
    SELECT u.* FROM users u
    JOIN friends f ON u.id = f.friend_id
    WHERE f.user_id = %s
    """
    friends = db.execute_query(query, (current_user["id"],))
    return friends

# 聊天功能API
@app.post("/messages", response_model=MessageResponse)
async def send_message(message: MessageBase, current_user = Depends(get_current_active_user)):
    """发送消息"""
    # 检查接收者是否存在
    receiver_exists = db.execute_query("SELECT * FROM users WHERE id = %s", (message.receiver_id,))
    if not receiver_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="接收者不存在"
        )
    
    # 检查是否是好友关系
    is_friend = db.execute_query(
        "SELECT * FROM friends WHERE user_id = %s AND friend_id = %s",
        (message.sender_id, message.receiver_id)
    )
    if not is_friend:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只能给好友发送消息"
        )
    
    # 发送消息
    query = """
    INSERT INTO messages (sender_id, receiver_id, content) 
    VALUES (%s, %s, %s)
    """
    message_id = db.execute_query(query, (message.sender_id, message.receiver_id, message.content))
    
    # 获取新发送的消息
    new_message = db.execute_query("SELECT * FROM messages WHERE id = %s", (message_id,))
    
    # 增加硬币
    db.execute_query(
        "UPDATE users SET coins = coins + 1 WHERE id = %s",
        (message.sender_id,)
    )
    
    # 记录硬币获取
    db.execute_query(
        "INSERT INTO coin_records (user_id, amount, reason) VALUES (%s, %s, %s)",
        (message.sender_id, 1, "发送消息获得")
    )
    
    return new_message[0]

@app.get("/messages/{friend_id}", response_model=List[MessageResponse])
async def get_messages(friend_id: int, current_user = Depends(get_current_active_user)):
    """获取与指定好友的聊天记录"""
    query = """
    SELECT * FROM messages 
    WHERE (sender_id = %s AND receiver_id = %s) OR (sender_id = %s AND receiver_id = %s)
    ORDER BY created_at ASC
    """
    messages = db.execute_query(query, (current_user["id"], friend_id, friend_id, current_user["id"]))
    return messages

# 硬币系统API
@app.get("/coins", response_model=dict)
async def get_coins(current_user = Depends(get_current_active_user)):
    """获取当前用户的硬币数量"""
    return {"coins": current_user["coins"]}

@app.get("/coin-records", response_model=List[CoinRecordResponse])
async def get_coin_records(current_user = Depends(get_current_active_user)):
    """获取硬币记录"""
    query = "SELECT * FROM coin_records WHERE user_id = %s ORDER BY created_at DESC"
    records = db.execute_query(query, (current_user["id"],))
    return records

# 奖品兑换API
@app.get("/prizes", response_model=List[PrizeResponse])
async def get_prizes():
    """获取所有可用奖品"""
    query = "SELECT * FROM prizes WHERE available = TRUE"
    prizes = db.execute_query(query)
    return prizes

@app.post("/prizes/{prize_id}/redeem")
async def redeem_prize(prize_id: int, current_user = Depends(get_current_active_user)):
    """兑换奖品"""
    # 检查奖品是否存在且可用
    prize = db.execute_query("SELECT * FROM prizes WHERE id = %s AND available = TRUE", (prize_id,))
    if not prize:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="奖品不存在或不可用"
        )
    
    prize = prize[0]
    
    # 检查用户硬币是否足够
    if current_user["coins"] < prize["cost"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="硬币不足"
        )
    
    # 扣除硬币
    db.execute_query(
        "UPDATE users SET coins = coins - %s WHERE id = %s",
        (prize["cost"], current_user["id"])
    )
    
    # 记录硬币使用
    db.execute_query(
        "INSERT INTO coin_records (user_id, amount, reason) VALUES (%s, %s, %s)",
        (current_user["id"], -prize["cost"], f"兑换奖品: {prize['name']}")
    )
    
    return {"message": f"成功兑换奖品: {prize['name']}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)