from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Ecommerce API Running"}

@app.get("/products")
def get_products():
    return [
        {
            "id": 1,
            "name": "iPhone 15",
            "price": 999
        },
        {
            "id": 2,
            "name": "Samsung S24",
            "price": 899
        },
        {
            "id": 3,
            "name": "AirPods Pro",
            "price": 249
        }
    ]