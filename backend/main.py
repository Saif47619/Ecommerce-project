import mimetypes
import os
import shutil
import uuid
from pathlib import Path
from starlette.concurrency import run_in_threadpool
from typing import Optional
from fastapi import Form
from fastapi import File, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from models import (
    User,
    Store,
    Item,
    Message,
    ItemImage,
    ConditionPassport,
)
from database import engine, SessionLocal, Base

from ai_fit import (
    BuyerFitData,
    FIT_DISCLAIMER,
    FIT_LABELS,
    FitDataError,
    GarmentFitData,
    assess_fit,
)

from ai_condition import (
    MAX_CONDITION_PHOTOS,
    MAX_PHOTO_BYTES,
    ConditionDataError,
    ConditionItemDetails,
    ConditionPhoto,
    analyze_condition,
    build_source_fingerprint,
)

from ai_listing import (
    MAX_LISTING_PHOTOS,
    MAX_PHOTO_BYTES as MAX_LISTING_PHOTO_BYTES,
    ListingDraftDetails,
    ListingPhoto,
    ListingPhotoDataError,
    analyze_listing_draft,
    analyze_listing_photos,
)


from ai_descriptions import (
    AIConfigurationError,
    AIGenerationError,
    ListingDetails,
    generate_listing_description,
)

from ai_search import interpret_search_query

from auth import hash_password, verify_password
from schemas import (
    UserCreate,
    LoginRequest,
    StoreCreate,
    ItemCreate,
    ItemUpdate,
    MessageCreate,
    OfferResponse,
    AISearchRequest,
    FitCheckRequest,
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

BACKEND_DIRECTORY = Path(__file__).resolve().parent
UPLOADS_DIRECTORY = BACKEND_DIRECTORY / "uploads"


def load_condition_sources(
    item: Item,
    db: Session,
) -> tuple[
    ConditionItemDetails,
    list[ConditionPhoto],
]:
    image_records = (
        db.query(ItemImage)
        .filter(ItemImage.item_id == item.id)
        .order_by(ItemImage.position)
        .limit(MAX_CONDITION_PHOTOS)
        .all()
    )

    image_urls = [
        image.image_url
        for image in image_records
    ]

    if not image_urls and item.image_url:
        image_urls = [item.image_url]

    details = ConditionItemDetails(
        title=item.title or "",
        category=item.category or "",
        brand=item.brand or "",
        seller_condition=item.condition or "",
    )

    photos: list[ConditionPhoto] = []

    for index, image_url in enumerate(
        image_urls,
        start=1,
    ):
        file_name = Path(image_url).name
        file_path = UPLOADS_DIRECTORY / file_name

        try:
            with file_path.open("rb") as image_file:
                image_bytes = image_file.read(
                    MAX_PHOTO_BYTES + 1
                )
        except OSError as exc:
            raise ConditionDataError(
                f"Photo {index} could not be read. "
                "Remove or replace the missing photo."
            ) from exc

        mime_type = (
            mimetypes.guess_type(file_name)[0]
            or ""
        )

        photos.append(
            ConditionPhoto(
                number=index,
                image_bytes=image_bytes,
                mime_type=mime_type,
            )
        )

    return details, photos


def serialize_condition_passport(
    passport: ConditionPassport,
) -> dict:
    return {
        "id": passport.id,
        "item_id": passport.item_id,
        "visual_grade": passport.visual_grade,
        "seller_condition_consistency": (
            passport.seller_condition_consistency
        ),
        "photo_coverage": passport.photo_coverage,
        "confidence": passport.confidence,
        "summary": passport.summary,
        "observations": passport.observations,
        "limitations": passport.limitations,
        "suggested_photos": (
            passport.suggested_photos
        ),
        "photo_count": passport.photo_count,
        "model": passport.model,
        "created_at": passport.created_at,
        "updated_at": passport.updated_at,
        "is_stale": not bool(
            passport.source_fingerprint
        ),
    }


def mark_condition_passport_stale(
    item_id: int,
    db: Session,
) -> None:
    passport = (
        db.query(ConditionPassport)
        .filter(
            ConditionPassport.item_id == item_id
        )
        .first()
    )

    if passport:
        passport.source_fingerprint = ""


@app.get("/")
def root():
    return {"message": "API Running"}


@app.get("/health")
def health():
    return {"status": "ok"}


async def read_listing_uploads(
    files: list[UploadFile],
) -> list[ListingPhoto]:
    if len(files) > MAX_LISTING_PHOTOS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Upload no more than {MAX_LISTING_PHOTOS} photos."
            ),
        )

    photos: list[ListingPhoto] = []

    for number, file in enumerate(files, start=1):
        content_type = file.content_type or ""

        if not content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=f"Photo {number} must be a valid image.",
            )

        image_bytes = await file.read(
            MAX_LISTING_PHOTO_BYTES + 1
        )

        if not image_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"Photo {number} is empty.",
            )

        if len(image_bytes) > MAX_LISTING_PHOTO_BYTES:
            raise HTTPException(
                status_code=413,
                detail=(
                    f"Photo {number} must be 10 MB or smaller."
                ),
            )

        photos.append(
            ListingPhoto(
                number=number,
                image_bytes=image_bytes,
                mime_type=content_type,
            )
        )

    return photos


@app.post("/ai/analyze-listing-photos")
async def analyze_ai_listing_photos(
    files: list[UploadFile] = File(...),
):
    photos = await read_listing_uploads(files)

    try:
        analysis, model = await run_in_threadpool(
            analyze_listing_photos,
            photos,
        )
    except ListingPhotoDataError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except AIConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except AIGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "analysis": analysis.model_dump(),
        "model": model,
    }


@app.post("/ai/review-listing")
async def review_ai_listing(
    files: list[UploadFile] = File(...),
    title: str = Form(""),
    category: str = Form(""),
    brand: str = Form(""),
    color: str = Form(""),
    condition: str = Form(""),
    size: str = Form(""),
):
    photos = await read_listing_uploads(files)
    details = ListingDraftDetails(
        title=title,
        category=category,
        brand=brand,
        color=color,
        condition=condition,
        size=size,
    )

    try:
        analysis, model = await run_in_threadpool(
            analyze_listing_draft,
            photos,
            details,
        )
    except ListingPhotoDataError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except AIConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except AIGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "analysis": analysis.model_dump(),
        "model": model,
    }


@app.post("/ai/generate-description")
async def generate_ai_description(
    image: UploadFile = File(...),
    title: str = Form(""),
    category: str = Form(""),
    brand: str = Form(""),
    condition: str = Form(""),
    color: str = Form(""),
    size: str = Form(""),
):
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload a valid image file")

    image_bytes = await image.read(10 * 1024 * 1024 + 1)

    if not image_bytes:
        raise HTTPException(status_code=400, detail="The image file is empty")

    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="The image must be 10 MB or smaller",
        )

    try:
        description, model = await run_in_threadpool(
            generate_listing_description,
            image_bytes,
            image.content_type,
            ListingDetails(
                title=title,
                category=category,
                brand=brand,
                condition=condition,
                color=color,
                size=size,
            ),
        )
    except AIConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except AIGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "description": description,
        "model": model,
    }

@app.post("/ai/search")
async def interpret_ai_search(request: AISearchRequest):
    try:
        intent, model = await run_in_threadpool(
            interpret_search_query,
            request.query,
        )
    except AIConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except AIGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "query": request.query.strip(),
        "intent": intent.model_dump(),
        "model": model,
    }

@app.post("/ai/fit-check")
async def check_ai_fit(
    request: FitCheckRequest,
    db: Session = Depends(get_db),
):
    item = db.query(Item).filter(Item.id == request.item_id).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found",
        )

    garment = GarmentFitData(
        title=item.title or "",
        category=item.category or "",
        size=item.size or "",
        chest_width_in=item.chest_width_in,
        shoulder_width_in=item.shoulder_width_in,
        waist_width_in=item.waist_width_in,
        hip_width_in=item.hip_width_in,
        length_in=item.length_in,
        inseam_in=item.inseam_in,
    )

    buyer = BuyerFitData(
        preferred_fit=request.preferred_fit,
        chest_in=request.chest_in,
        shoulder_in=request.shoulder_in,
        waist_in=request.waist_in,
        hip_in=request.hip_in,
        inseam_in=request.inseam_in,
    )

    try:
        assessment, model, compared_measurements = (
            await run_in_threadpool(
                assess_fit,
                garment,
                buyer,
            )
        )
    except FitDataError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
    except AIConfigurationError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc
    except AIGenerationError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc

    return {
        "item_id": item.id,
        "verdict": assessment.verdict,
        "label": FIT_LABELS[assessment.verdict],
        "confidence": assessment.confidence,
        "summary": assessment.summary,
        "reasons": assessment.reasons,
        "compared_measurements": compared_measurements,
        "disclaimer": FIT_DISCLAIMER,
        "model": model,
    }


@app.get("/items/{item_id}/condition-passport")
def get_condition_passport(
    item_id: int,
    db: Session = Depends(get_db),
):
    item = (
        db.query(Item)
        .filter(Item.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found",
        )

    passport = (
        db.query(ConditionPassport)
        .filter(
            ConditionPassport.item_id == item_id
        )
        .first()
    )

    if not passport:
        return {
            "status": "not_generated",
            "passport": None,
        }

    is_stale = not bool(
        passport.source_fingerprint
    )

    return {
        "status": (
            "stale"
            if is_stale
            else "ready"
        ),
        "passport": serialize_condition_passport(
            passport
        ),
    }


@app.post("/items/{item_id}/condition-passport")
async def generate_condition_passport(
    item_id: int,
    owner_id: int,
    db: Session = Depends(get_db),
):
    item = (
        db.query(Item)
        .filter(Item.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Item not found",
        )

    store = (
        db.query(Store)
        .filter(Store.id == item.store_id)
        .first()
    )

    if not store or store.owner_id != owner_id:
        raise HTTPException(
            status_code=403,
            detail=(
                "Only the listing owner can generate "
                "its condition passport."
            ),
        )

    try:
        details, photos = load_condition_sources(
            item,
            db,
        )

        current_fingerprint = (
            await run_in_threadpool(
                build_source_fingerprint,
                details,
                photos,
            )
        )
    except ConditionDataError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    passport = (
        db.query(ConditionPassport)
        .filter(
            ConditionPassport.item_id == item_id
        )
        .first()
    )

    if (
        passport
        and passport.source_fingerprint
        == current_fingerprint
    ):
        return {
            "status": "ready",
            "cached": True,
            "passport": (
                serialize_condition_passport(
                    passport
                )
            ),
        }

    try:
        (
            assessment,
            model,
            source_fingerprint,
        ) = await run_in_threadpool(
            analyze_condition,
            details,
            photos,
        )
    except ConditionDataError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
    except AIConfigurationError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc
    except AIGenerationError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc

    assessment_data = assessment.model_dump()

    if not passport:
        passport = ConditionPassport(
            item_id=item.id,
            visual_grade=(
                assessment.visual_grade
            ),
            seller_condition_consistency=(
                assessment.seller_condition_consistency
            ),
            photo_coverage=(
                assessment.photo_coverage
            ),
            confidence=assessment.confidence,
            summary=assessment.summary,
            observations=assessment_data[
                "observations"
            ],
            limitations=assessment.limitations,
            suggested_photos=(
                assessment.suggested_photos
            ),
            photo_count=len(photos),
            source_fingerprint=(
                source_fingerprint
            ),
            model=model,
        )
        db.add(passport)
    else:
        passport.visual_grade = (
            assessment.visual_grade
        )
        passport.seller_condition_consistency = (
            assessment.seller_condition_consistency
        )
        passport.photo_coverage = (
            assessment.photo_coverage
        )
        passport.confidence = (
            assessment.confidence
        )
        passport.summary = assessment.summary
        passport.observations = (
            assessment_data["observations"]
        )
        passport.limitations = (
            assessment.limitations
        )
        passport.suggested_photos = (
            assessment.suggested_photos
        )
        passport.photo_count = len(photos)
        passport.source_fingerprint = (
            source_fingerprint
        )
        passport.model = model

    db.commit()
    db.refresh(passport)

    return {
        "status": "ready",
        "cached": False,
        "passport": serialize_condition_passport(
            passport
        ),
        }

@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        role="user",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
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
        chest_width_in=item.chest_width_in,
        shoulder_width_in=item.shoulder_width_in,
        waist_width_in=item.waist_width_in,
        hip_width_in=item.hip_width_in,
        length_in=item.length_in,
        inseam_in=item.inseam_in,
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
    condition: Optional[str] = None,
    color: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Item)

    if search:
        query = query.filter(Item.title.ilike(f"%{search}%"))
    if size:
        query = query.filter(Item.size.ilike(size))
    if category:
        query = query.filter(Item.category == category)
    if brand:
        query = query.filter(Item.brand.ilike(f"%{brand}%"))
    if condition:
        query = query.filter(Item.condition == condition)
    if color:
        query = query.filter(Item.color.ilike(f"%{color}%"))
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
            "chest_width_in": item.chest_width_in,
            "shoulder_width_in": item.shoulder_width_in,
            "waist_width_in": item.waist_width_in,
            "hip_width_in": item.hip_width_in,
            "length_in": item.length_in,
            "inseam_in": item.inseam_in,
            "image_url": item.image_url,
            "is_sold": item.is_sold,
            "buyer_id": item.buyer_id,
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
        "chest_width_in": item.chest_width_in,
        "shoulder_width_in": item.shoulder_width_in,
        "waist_width_in": item.waist_width_in,
        "hip_width_in": item.hip_width_in,
        "length_in": item.length_in,
        "inseam_in": item.inseam_in,
        "created_at": item.created_at,
        "image_url": item.image_url,
        "is_sold": item.is_sold,
        "buyer_id": item.buyer_id,
        "store_id": item.store_id,
        "store": {
            "id": store.id,
            "name": store.name,
            "owner_id": store.owner_id,
        } if store else None,
    }


@app.put("/items/{item_id}")
def update_item(
    item_id: int,
    item: ItemUpdate,
    db: Session = Depends(get_db),
):
    existing_item = (
        db.query(Item)
        .filter(Item.id == item_id)
        .first()
    )

    if not existing_item:
        raise HTTPException(
            status_code=404,
            detail="Item not found",
        )

    cover_image = (
        db.query(ItemImage)
        .filter(ItemImage.item_id == item_id)
        .order_by(
            ItemImage.position,
            ItemImage.id,
        )
        .first()
    )

    next_image_url = (
        cover_image.image_url
        if cover_image
        else item.image_url
    )

    passport_source_changed = any(
        (
            existing_item.title != item.title,
            existing_item.category != item.category,
            existing_item.brand != item.brand,
            existing_item.condition != item.condition,
            existing_item.image_url != next_image_url,
        )
    )

    existing_item.title = item.title
    existing_item.description = item.description
    existing_item.price = item.price
    existing_item.size = item.size
    existing_item.category = item.category
    existing_item.brand = item.brand
    existing_item.condition = item.condition
    existing_item.color = item.color
    existing_item.chest_width_in = (
        item.chest_width_in
    )
    existing_item.shoulder_width_in = (
        item.shoulder_width_in
    )
    existing_item.waist_width_in = (
        item.waist_width_in
    )
    existing_item.hip_width_in = (
        item.hip_width_in
    )
    existing_item.length_in = item.length_in
    existing_item.inseam_in = item.inseam_in
    existing_item.image_url = next_image_url



    if passport_source_changed:
        mark_condition_passport_stale(
            item_id,
            db,
        )

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
    mark_condition_passport_stale(
        item_id,
        db,
    )
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

        if existing_count == 0 and i == 0:
            item.image_url = image_url
    mark_condition_passport_stale(
        item_id,
        db,)

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
    mark_condition_passport_stale(
        image.item_id,
        db,
        )
    db.delete(image)
    db.commit()

    remaining = db.query(ItemImage).filter(ItemImage.item_id == image.item_id).order_by(ItemImage.position).all()
    if item:
        item.image_url = remaining[0].image_url if remaining else None
        db.commit()

    return {
    "message": "Image deleted",
    "image_url": item.image_url if item else None,
}


@app.put("/items/{item_id}/reorder-images")
def reorder_item_images(item_id: int, image_ids: list[int], db: Session = Depends(get_db)):
    for index, img_id in enumerate(image_ids):
        image = db.query(ItemImage).filter(ItemImage.id == img_id, ItemImage.item_id == item_id).first()
        if image:
            image.position = index
    mark_condition_passport_stale(
        item_id,
        db,
        )
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



@app.get("/items/{item_id}/similar")
def get_similar_items(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    query = db.query(Item).filter(
        Item.id != item_id,
        Item.is_sold == False,
        Item.store_id != item.store_id,
    )

    if item.category:
        query = query.filter(Item.category == item.category)

    if item.price:
        low = item.price * 0.6
        high = item.price * 1.6
        query = query.filter(Item.price >= low, Item.price <= high)

    return query.limit(6).all()
