import csv
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, ValidationError, field_validator
from sqlalchemy.orm import Session

from models import PricingReference


MAX_REFERENCE_AGE_DAYS = 90
REQUIRED_COLUMNS = {
    "source_name",
    "source_listing_id",
    "source_url",
    "title",
    "category",
    "brand",
    "condition",
    "price_pkr",
    "reference_type",
    "observed_at",
}


class PricingReferenceInput(BaseModel):
    source_name: str = Field(min_length=2, max_length=100)
    source_listing_id: str = Field(min_length=1, max_length=200)
    source_url: str = Field(default="", max_length=2000)
    title: str = Field(min_length=2, max_length=200)
    category: str = Field(default="", max_length=80)
    brand: str = Field(default="", max_length=100)
    condition: str = Field(default="", max_length=40)
    price_pkr: float = Field(ge=100, le=100_000_000)
    reference_type: Literal["asking", "sold"]
    observed_at: datetime

    @field_validator(
        "source_name",
        "source_listing_id",
        "title",
        mode="before",
    )
    @classmethod
    def strip_required_text(cls, value):
        return str(value or "").strip()

    @field_validator(
        "source_url",
        "category",
        "brand",
        "condition",
        mode="before",
    )
    @classmethod
    def strip_optional_text(cls, value):
        return str(value or "").strip()

    @field_validator("source_url")
    @classmethod
    def validate_source_url(cls, value: str) -> str:
        if value and not value.casefold().startswith(("http://", "https://")):
            raise ValueError("source_url must use http:// or https://")

        return value

    @field_validator("observed_at")
    @classmethod
    def reject_future_observation(cls, value: datetime) -> datetime:
        if value.tzinfo is not None:
            value = value.astimezone(timezone.utc).replace(tzinfo=None)

        if value > utc_now() + timedelta(days=1):
            raise ValueError("observed_at cannot be in the future")

        return value


@dataclass(frozen=True)
class ImportSummary:
    created: int
    updated: int

    @property
    def total(self) -> int:
        return self.created + self.updated


def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def reference_cutoff(now: datetime | None = None) -> datetime:
    current_time = now or utc_now()
    return current_time - timedelta(days=MAX_REFERENCE_AGE_DAYS)


def load_pricing_reference_csv(
    file_path: str | Path,
) -> list[PricingReferenceInput]:
    path = Path(file_path)

    if not path.is_file():
        raise ValueError(f"Pricing reference file was not found: {path}")

    rows: list[PricingReferenceInput] = []
    seen_source_listings: set[tuple[str, str]] = set()

    with path.open("r", encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        headers = set(reader.fieldnames or [])
        missing_columns = sorted(REQUIRED_COLUMNS - headers)

        if missing_columns:
            raise ValueError(
                "Pricing reference CSV is missing columns: "
                + ", ".join(missing_columns)
            )

        for row_number, row in enumerate(reader, start=2):
            if not any(str(value or "").strip() for value in row.values()):
                continue

            try:
                reference = PricingReferenceInput.model_validate(row)
            except ValidationError as exc:
                raise ValueError(
                    f"Invalid pricing reference on CSV row {row_number}: {exc}"
                ) from exc

            source_key = (
                reference.source_name.casefold(),
                reference.source_listing_id.casefold(),
            )

            if source_key in seen_source_listings:
                raise ValueError(
                    "Duplicate pricing reference on CSV row "
                    f"{row_number}: {reference.source_name} / "
                    f"{reference.source_listing_id}"
                )

            seen_source_listings.add(source_key)
            rows.append(reference)

    if not rows:
        raise ValueError("Pricing reference CSV does not contain any data rows.")

    return rows


def upsert_pricing_references(
    db: Session,
    rows: list[PricingReferenceInput],
    *,
    verified_by: str,
) -> ImportSummary:
    reviewer = verified_by.strip()

    if len(reviewer) < 2:
        raise ValueError("verified_by must identify the human reviewer.")

    created = 0
    updated = 0
    verified_at = utc_now()

    for row in rows:
        reference = (
            db.query(PricingReference)
            .filter(
                PricingReference.source_name == row.source_name,
                PricingReference.source_listing_id == row.source_listing_id,
            )
            .first()
        )

        if reference is None:
            reference = PricingReference(
                source_name=row.source_name,
                source_listing_id=row.source_listing_id,
            )
            db.add(reference)
            created += 1
        else:
            updated += 1

        reference.source_url = row.source_url or None
        reference.title = row.title
        reference.category = row.category or None
        reference.brand = row.brand or None
        reference.condition = row.condition or None
        reference.price_pkr = row.price_pkr
        reference.reference_type = row.reference_type
        reference.observed_at = row.observed_at
        reference.is_verified = True
        reference.verified_by = reviewer
        reference.verified_at = verified_at
        reference.updated_at = verified_at

    db.commit()

    return ImportSummary(created=created, updated=updated)
