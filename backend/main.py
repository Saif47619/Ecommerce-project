from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, SessionLocal, Base
from models import User, Store, Item
from schemas import (
    UserCreate,
    LoginRequest,
    StoreCreate,
    ItemCreate,
    ItemUpdate,
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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def root():
    return {"message": "API Running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

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


@app.post("/login")
def login(user: LoginRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if not existing_user or not verify_password(user.password, existing_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "message": "Login successful",
        "user_id": existing_user.id,
        "name": existing_user.name,
        "role": existing_user.role,
    }


@app.post("/stores")
def create_store(store: StoreCreate, db: Session = Depends(get_db)):
    owner = db.query(User).filter(User.id == store.owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="User not found")
    if owner.role != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can create a store")

    existing_store = db.query(Store).filter(Store.owner_id == store.owner_id).first()
    if existing_store:
        raise HTTPException(status_code=400, detail="This seller already has a store")

    new_store = Store(
        name=store.name,
        description=store.description,
        owner_id=store.owner_id,
    )
    db.add(new_store)
    db.commit()
    db.refresh(new_store)
    return new_store


@app.get("/stores/by-owner/{owner_id}")
def get_store_by_owner(owner_id: int, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.owner_id == owner_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store


@app.get("/stores/{store_id}")
def get_store(store_id: int, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store


@app.post("/items")
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.id == item.store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    new_item = Item(
        title=item.title,
        description=item.description,
        price=item.price,
        size=item.size,
        image_url=item.image_url,
        store_id=item.store_id,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@app.get("/items")
def get_items(db: Session = Depends(get_db)):
    return db.query(Item).all()


@app.get("/stores/{store_id}/items")
def get_store_items(store_id: int, db: Session = Depends(get_db)):
    return db.query(Item).filter(Item.store_id == store_id).all()


@app.get("/items/{item_id}")
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@app.put("/items/{item_id}")
def update_item(item_id: int, item: ItemUpdate, db: Session = Depends(get_db)):
    existing_item = db.query(Item).filter(Item.id == item_id).first()
    if not existing_item:
        raise HTTPException(status_code=404, detail="Item not found")

    existing_item.title = item.title
    existing_item.description = item.description
    existing_item.price = item.price
    existing_item.size = item.size
    existing_item.image_url = item.image_url

    db.commit()
    db.refresh(existing_item)
    return existing_item


@app.post("/items/{item_id}/buy")
def buy_item(item_id: int, buyer_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item.is_sold:
        raise HTTPException(status_code=400, detail="Item already sold")

    item.is_sold = True
    item.buyer_id = buyer_id
    db.commit()
    db.refresh(item)
    return item


@app.delete("/items/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()
    return {"message": "Item deleted successfully"}