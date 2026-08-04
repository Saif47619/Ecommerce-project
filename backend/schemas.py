from pydantic import BaseModel
from typing import Optional


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str


class LoginRequest(BaseModel):
    email: str
    password: str


class StoreCreate(BaseModel):
    name: str
    description: Optional[str] = None
    owner_id: int


class ItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    size: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    store_id: int


class ItemUpdate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    size: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None

class MessageCreate(BaseModel):
    sender_id: int
    receiver_id: int
    item_id: Optional[int] = None
    text: str
    offer_price: Optional[float] = None


class OfferResponse(BaseModel):
    status: str  # "accepted" or "declined"