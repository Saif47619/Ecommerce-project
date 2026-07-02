from fastapi import FastAPI
from database import engine, SessionLocal
from models import Base, Product

app = FastAPI()

Base.metadata.create_all(bind=engine)

@app.post("/products")
def create_product():
    db = SessionLocal()

    new_product = Product(
        name="Shirt",
        price=20
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {
        "id": new_product.id,
        "name": new_product.name,
        "price": new_product.price
    }