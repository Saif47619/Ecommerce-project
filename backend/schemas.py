from pydantic import BaseModel, Field, model_validator
from typing import Literal, Optional



class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AISearchRequest(BaseModel):
    query: str = Field(min_length=2, max_length=300)

class FitCheckRequest(BaseModel):
    item_id: int = Field(gt=0)
    preferred_fit: Literal[
        "fitted",
        "regular",
        "relaxed",
    ] = "regular"

    chest_in: Optional[float] = Field(
        default=None,
        gt=0,
        le=100,
    )
    shoulder_in: Optional[float] = Field(
        default=None,
        gt=0,
        le=100,
    )
    waist_in: Optional[float] = Field(
        default=None,
        gt=0,
        le=100,
    )
    hip_in: Optional[float] = Field(
        default=None,
        gt=0,
        le=100,
    )
    inseam_in: Optional[float] = Field(
        default=None,
        gt=0,
        le=100,
    )

    @model_validator(mode="after")
    def require_body_measurement(self):
        measurements = (
            self.chest_in,
            self.shoulder_in,
            self.waist_in,
            self.hip_in,
            self.inseam_in,
        )

        if all(value is None for value in measurements):
            raise ValueError(
                "Enter at least one body measurement."
            )

        return self


class StoreCreate(BaseModel):
    name: str
    description: Optional[str] = None
    owner_id: int


class ItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    size: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    store_id: int
    condition: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    chest_width_in: Optional[float] = Field(default=None, gt=0, le=100)
    shoulder_width_in: Optional[float] = Field(default=None, gt=0, le=100)
    waist_width_in: Optional[float] = Field(default=None, gt=0, le=100)
    hip_width_in: Optional[float] = Field(default=None, gt=0, le=100)
    length_in: Optional[float] = Field(default=None, gt=0, le=100)
    inseam_in: Optional[float] = Field(default=None, gt=0, le=100)


class ItemUpdate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    size: Optional[str] = None
    category: Optional[str] = None
    condition: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    image_url: Optional[str] = None
    chest_width_in: Optional[float] = Field(default=None, gt=0, le=100)
    shoulder_width_in: Optional[float] = Field(default=None, gt=0, le=100)
    waist_width_in: Optional[float] = Field(default=None, gt=0, le=100)
    hip_width_in: Optional[float] = Field(default=None, gt=0, le=100)
    length_in: Optional[float] = Field(default=None, gt=0, le=100)
    inseam_in: Optional[float] = Field(default=None, gt=0, le=100)

class MessageCreate(BaseModel):
    sender_id: int
    receiver_id: int
    item_id: Optional[int] = None
    text: str
    offer_price: Optional[float] = None


class OfferResponse(BaseModel):
    status: str  # "accepted" or "declined"