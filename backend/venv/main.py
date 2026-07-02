from fastapi import FastAPI
from database import engine
from models import Base

app = FastAPI()

Base.metadata.create_all(bind=engine)

@app.get("/")
def root():
    return {"message": "Ecommerce API Running"}

@app.get("/products")
def get_products():
    return [
        {"id": 1, "name": "iPhone 15", "price": 999},
        {"id": 2, "name": "Samsung S24", "price": 899},
        {"id": 3, "name": "AirPods Pro", "price": 249},
    ]