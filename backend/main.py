from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, SessionLocal
from models import Base, User, Product
from schemas import (
    UserCreate,
    LoginRequest,
    ProductCreate,
    ProductUpdate,
)
from auth import hash_password, verify_password

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "API Running"}


@app.get("/health")
def health():
    return {"status": "ok"}


# --------------------
# SIGNUP
# --------------------
@app.post("/signup")
def signup(user: UserCreate):
    db = SessionLocal()

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_user:
        return {"message": "Email already registered"}

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_user.role,
    }


# --------------------
# LOGIN
# --------------------
@app.post("/login")
def login(user: LoginRequest):
    db = SessionLocal()

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not existing_user:
        return {"message": "Invalid credentials"}

    if verify_password(
        user.password,
        existing_user.password
    ):
        return {
            "message": "Login successful",
            "user_id": existing_user.id,
        }

    return {"message": "Invalid credentials"}


# --------------------
# CREATE PRODUCT
# --------------------
@app.post("/products")
def create_product(product: ProductCreate):
    db = SessionLocal()

    new_product = Product(
        title=product.title,
        description=product.description,
        price=product.price,
        image_url=product.image_url,
        seller_id=product.seller_id,
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


# --------------------
# GET ALL PRODUCTS
# --------------------
@app.get("/products")
def get_products():
    db = SessionLocal()

    products = db.query(Product).all()

    return products


# --------------------
# GET SINGLE PRODUCT
# --------------------
@app.get("/products/{product_id}")
def get_product(product_id: int):
    db = SessionLocal()

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        return {"message": "Product not found"}

    return product


# --------------------
# UPDATE PRODUCT
# --------------------
@app.put("/products/{product_id}")
def update_product(
    product_id: int,
    product: ProductUpdate
):
    db = SessionLocal()

    existing_product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not existing_product:
        return {"message": "Product not found"}

    existing_product.title = product.title
    existing_product.description = product.description
    existing_product.price = product.price
    existing_product.image_url = product.image_url

    db.commit()
    db.refresh(existing_product)

    return existing_product


# --------------------
# DELETE PRODUCT
# --------------------
@app.delete("/products/{product_id}")
def delete_product(product_id: int):
    db = SessionLocal()

    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if not product:
        return {"message": "Product not found"}

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully"
    }