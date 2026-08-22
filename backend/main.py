import os
import shutil
import uuid
from typing import Optional
from fastapi import File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from models import User, Store, Item, Message, ItemImage
from database import engine, SessionLocal, Base

from auth import hash_password, verify_password
from schemas import (
    UserCreate,
    LoginRequest,
    StoreCreate,
    ItemCreate,
    ItemUpdate,
    MessageCreate,
    OfferResponse,
)

app = FastAPI()

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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

    existing_store = db.query(Store).filter(Store.owner_id == store.owner_id).first()
    if existing_store:
        raise HTTPException(status_code=400, detail="You already have a store")

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
        category=item.category,
        brand=item.brand,
        condition=item.condition,
        color=item.color,
        image_url=item.image_url,
        store_id=item.store_id,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


@app.get("/items")
def get_items(
    search: Optional[str] = None,
    size: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Item)

    if search:
        query = query.filter(Item.title.ilike(f"%{search}%"))
    if size:
        query = query.filter(Item.size == size)
    if category:
        query = query.filter(Item.category == category)
    if brand:
        query = query.filter(Item.brand.ilike(f"%{brand}%"))
    if min_price is not None:
        query = query.filter(Item.price >= min_price)
    if max_price is not None:
        query = query.filter(Item.price <= max_price)

    query = query.filter(Item.is_sold == False)
    items = query.all()

    result = []
    for item in items:
        photo_count = db.query(ItemImage).filter(ItemImage.item_id == item.id).count()
        result.append({
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "price": item.price,
            "size": item.size,
            "category": item.category,
            "brand": item.brand,
            "condition": item.condition,
            "color": item.color,
            "image_url": item.image_url,
            "is_sold": item.is_sold,
            "store_id": item.store_id,
            "photo_count": photo_count,
        })

    return result


@app.get("/stores/{store_id}/items")
def get_store_items(store_id: int, db: Session = Depends(get_db)):
    return db.query(Item).filter(Item.store_id == store_id).all()


@app.get("/stores/{store_id}/items/{exclude_item_id}/other")
def get_other_store_items(store_id: int, exclude_item_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Item)
        .filter(Item.store_id == store_id, Item.id != exclude_item_id, Item.is_sold == False)
        .limit(8)
        .all()
    )


@app.get("/users/{user_id}/purchases")
def get_user_purchases(user_id: int, db: Session = Depends(get_db)):
    return db.query(Item).filter(Item.buyer_id == user_id).all()


@app.get("/items/{item_id}")
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    store = db.query(Store).filter(Store.id == item.store_id).first()

    return {
        "id": item.id,
        "title": item.title,
        "description": item.description,
        "price": item.price,
        "size": item.size,
        "category": item.category,
        "brand": item.brand,
        "condition": item.condition,
        "color": item.color,
        "created_at": item.created_at,
        "image_url": item.image_url,
        "is_sold": item.is_sold,
        "store_id": item.store_id,
        "store": {
            "id": store.id,
            "name": store.name,
            "owner_id": store.owner_id,
        } if store else None,
    }


@app.put("/items/{item_id}")
def update_item(item_id: int, item: ItemUpdate, db: Session = Depends(get_db)):
    existing_item = db.query(Item).filter(Item.id == item_id).first()
    if not existing_item:
        raise HTTPException(status_code=404, detail="Item not found")

    existing_item.title = item.title
    existing_item.description = item.description
    existing_item.price = item.price
    existing_item.size = item.size
    existing_item.category = item.category
    existing_item.brand = item.brand
    existing_item.condition = item.condition
    existing_item.color = item.color
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

    store = db.query(Store).filter(Store.id == item.store_id).first()
    if store and store.owner_id == buyer_id:
        raise HTTPException(status_code=400, detail="You can't buy your own item")

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

    db.query(ItemImage).filter(ItemImage.item_id == item_id).delete()

    messages = db.query(Message).filter(Message.item_id == item_id).all()
    for m in messages:
        m.item_id = None

    db.delete(item)
    db.commit()
    return {"message": "Item deleted successfully"}


@app.post("/items/{item_id}/upload-image")
def upload_item_image(
    item_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join("uploads", unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    item.image_url = f"/uploads/{unique_filename}"
    db.commit()
    db.refresh(item)
    return item


@app.post("/messages")
def send_message(message: MessageCreate, db: Session = Depends(get_db)):
    new_message = Message(
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        item_id=message.item_id,
        text=message.text,
        offer_price=message.offer_price,
        offer_status="pending" if message.offer_price is not None else None,
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message


@app.put("/messages/{message_id}/respond-offer")
def respond_offer(message_id: int, response: OfferResponse, db: Session = Depends(get_db)):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    if message.offer_price is None:
        raise HTTPException(status_code=400, detail="This message is not an offer")
    if message.offer_status != "pending":
        raise HTTPException(status_code=400, detail="This offer was already responded to")

    if response.status == "accepted":
        if not message.item_id:
            raise HTTPException(status_code=400, detail="This offer isn't linked to an item")

        item = db.query(Item).filter(Item.id == message.item_id).first()
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")
        if item.is_sold:
            raise HTTPException(status_code=400, detail="Item already sold")

        item.is_sold = True
        item.buyer_id = message.sender_id
        item.price = message.offer_price

        other_offers = (
            db.query(Message)
            .filter(
                Message.item_id == message.item_id,
                Message.id != message.id,
                Message.offer_status == "pending",
            )
            .all()
        )
        for other in other_offers:
            other.offer_status = "declined"

    message.offer_status = response.status
    db.commit()
    db.refresh(message)
    return message


@app.get("/messages/thread/{user_a}/{user_b}")
def get_thread(user_a: int, user_b: int, db: Session = Depends(get_db)):
    messages = (
        db.query(Message)
        .filter(
            ((Message.sender_id == user_a) & (Message.receiver_id == user_b))
            | ((Message.sender_id == user_b) & (Message.receiver_id == user_a))
        )
        .order_by(Message.created_at.asc())
        .all()
    )

    result = []
    for m in messages:
        item_title = None
        if m.item_id:
            item = db.query(Item).filter(Item.id == m.item_id).first()
            if item:
                item_title = item.title

        result.append({
            "id": m.id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "item_id": m.item_id,
            "item_title": item_title,
            "text": m.text,
            "offer_price": m.offer_price,
            "offer_status": m.offer_status,
            "paid": m.paid,
            "created_at": m.created_at,
        })

    return result


@app.get("/users/{user_id}/conversations")
def get_conversations(user_id: int, db: Session = Depends(get_db)):
    messages = (
        db.query(Message)
        .filter((Message.sender_id == user_id) | (Message.receiver_id == user_id))
        .order_by(Message.created_at.desc())
        .all()
    )

    seen = {}
    for m in messages:
        other_id = m.receiver_id if m.sender_id == user_id else m.sender_id
        if other_id not in seen:
            other_user = db.query(User).filter(User.id == other_id).first()
            seen[other_id] = {
                "user_id": other_id,
                "name": other_user.name if other_user else "Unknown",
                "last_message": m.text,
                "last_message_at": m.created_at,
            }

    return list(seen.values())


@app.post("/items/{item_id}/upload-images")
async def upload_item_images(
    item_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    existing_count = db.query(ItemImage).filter(ItemImage.item_id == item_id).count()

    saved_images = []
    for i, file in enumerate(files):
        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join("uploads", unique_filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        image_url = f"/uploads/{unique_filename}"

        new_image = ItemImage(item_id=item_id, image_url=image_url, position=existing_count + i)
        db.add(new_image)
        saved_images.append(image_url)

        if not item.image_url:
            item.image_url = image_url

    db.commit()
    return {"images": saved_images}


@app.get("/items/{item_id}/images")
def get_item_images(item_id: int, db: Session = Depends(get_db)):
    images = db.query(ItemImage).filter(ItemImage.item_id == item_id).order_by(ItemImage.position).all()
    return images


@app.delete("/item-images/{image_id}")
def delete_item_image(image_id: int, db: Session = Depends(get_db)):
    image = db.query(ItemImage).filter(ItemImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    item = db.query(Item).filter(Item.id == image.item_id).first()
    db.delete(image)
    db.commit()

    remaining = db.query(ItemImage).filter(ItemImage.item_id == image.item_id).order_by(ItemImage.position).all()
    if item:
        item.image_url = remaining[0].image_url if remaining else None
        db.commit()

    return {"message": "Image deleted"}


@app.put("/items/{item_id}/reorder-images")
def reorder_item_images(item_id: int, image_ids: list[int], db: Session = Depends(get_db)):
    for index, img_id in enumerate(image_ids):
        image = db.query(ItemImage).filter(ItemImage.id == img_id, ItemImage.item_id == item_id).first()
        if image:
            image.position = index
    db.commit()

    images = db.query(ItemImage).filter(ItemImage.item_id == item_id).order_by(ItemImage.position).all()

    item = db.query(Item).filter(Item.id == item_id).first()
    if item and images:
        item.image_url = images[0].image_url
        db.commit()

    return images



@app.put("/messages/{message_id}/mark-paid")
def mark_message_paid(message_id: int, db: Session = Depends(get_db)):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    if message.offer_status != "accepted":
        raise HTTPException(status_code=400, detail="This offer hasn't been accepted yet")

    message.paid = True
    db.commit()
    db.refresh(message)
    return message