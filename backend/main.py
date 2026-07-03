from fastapi import FastAPI
from database import engine, SessionLocal
from models import Base, Product

app = FastAPI()

Base.metadata.create_all(bind=engine)
@app.get("/")
def root():
    return {"message": "API Running"}
@app.post("/products")
def create_product():
    db = SessionLocal()
@app.get("/products")
def get_products():
    db = SessionLocal()

    products = db.query(Product).all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "price": p.price
        }
        for p in products
    ]
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
@app.get("/health")
def health():
    return {"status": "ok"}