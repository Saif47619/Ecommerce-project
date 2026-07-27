from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base


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
    image_url = Column(String)
    is_sold = Column(Boolean, default=False)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    store = relationship("Store", back_populates="items")