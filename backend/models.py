from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    coins: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class FriendBase(BaseModel):
    user_id: int
    friend_id: int

class FriendResponse(FriendBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    sender_id: int
    receiver_id: int
    content: str

class MessageResponse(MessageBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class CoinRecordBase(BaseModel):
    user_id: int
    amount: int
    reason: str

class CoinRecordResponse(CoinRecordBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class PrizeBase(BaseModel):
    name: str
    description: Optional[str] = None
    cost: int
    image_url: Optional[str] = None
    available: bool = True

class PrizeResponse(PrizeBase):
    id: int
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None