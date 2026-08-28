from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import DateTime
from datetime import datetime


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)
    text = Column(String, nullable=False)
    offer_price = Column(Float, nullable=True)
    offer_status = Column(String, nullable=True)  # "pending", "accepted", "declined"
    created_at = Column(DateTime, default=datetime.utcnow)
    paid = Column(Boolean, default=False)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)

    store = relationship("Store", back_populates="owner", uselist=False)


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    owner = relationship("User", back_populates="store")
    items = relationship("Item", back_populates="store")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    size = Column(String)
    category = Column(String, nullable=True)
    brand = Column(String, nullable=True)
    image_url = Column(String)
    is_sold = Column(Boolean, default=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    condition = Column(String, nullable=True)
    color = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    store = relationship("Store", back_populates="items")
    condition_passport = relationship(
    "ConditionPassport",
    back_populates="item",
    uselist=False,
    cascade="all, delete-orphan",
    )
    chest_width_in = Column(Float, nullable=True)
    shoulder_width_in = Column(Float, nullable=True)
    waist_width_in = Column(Float, nullable=True)
    hip_width_in = Column(Float, nullable=True)
    length_in = Column(Float, nullable=True)
    inseam_in = Column(Float, nullable=True)


class ItemImage(Base):
    __tablename__ = "item_images"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    image_url = Column(String, nullable=False)
    position = Column(Integer, default=0)



class ConditionPassport(Base):
    __tablename__ = "condition_passports"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )
    item_id = Column(
        Integer,
        ForeignKey(
            "items.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        unique=True,
    )

    visual_grade = Column(
        String(20),
        nullable=False,
    )
    seller_condition_consistency = Column(
        String(30),
        nullable=False,
    )
    photo_coverage = Column(
        String(20),
        nullable=False,
    )
    confidence = Column(
        String(10),
        nullable=False,
    )

    summary = Column(
        String,
        nullable=False,
    )

    observations = Column(
        JSONB,
        nullable=False,
        default=list,
    )
    limitations = Column(
        JSONB,
        nullable=False,
        default=list,
    )
    suggested_photos = Column(
        JSONB,
        nullable=False,
        default=list,
    )

    photo_count = Column(
        Integer,
        nullable=False,
    )
    source_fingerprint = Column(
        String(64),
        nullable=False,
    )
    model = Column(
        String(100),
        nullable=False,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    item = relationship(
        "Item",
        back_populates="condition_passport",
    )