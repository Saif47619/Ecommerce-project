from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ProductCreate(BaseModel):
    title: str
    description: str
    price: float
    image_url: str
    seller_id: int

class ProductUpdate(BaseModel):
    title: str
    description: str
    price: float
    image_url: str