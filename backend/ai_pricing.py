import math
import re
from dataclasses import dataclass
from statistics import median
from typing import Literal, Optional

from pydantic import BaseModel, Field


PricingStatus = Literal[
    "ready",
    "insufficient_data",
]
PricingConfidence = Literal[
    "low",
    "medium",
    "high",
]
PricePosition = Literal[
    "below_range",
    "within_range",
    "above_range",
]


MIN_COMPARABLES = 3
MAX_COMPARABLES = 12
MIN_VALID_PKR_PRICE = 100
PKR_ROUNDING_STEP = 50

GENERIC_BRANDS = {
    "",
    "none",
    "no brand",
    "unbranded",
    "unknown",
}

STOP_WORDS = {
    "a",
    "an",
    "and",
    "for",
    "in",
    "item",
    "ka",
    "ke",
    "ki",
    "ko",
    "mein",
    "men",
    "mujhe",
    "of",
    "the",
    "with",
}

PRODUCT_FAMILIES: dict[str, set[str]] = {
    "blazer": {"blazer", "suit jacket"},
    "boots": {"boot", "boots"},
    "dress": {"dress", "frock", "gown"},
    "handbag": {"bag", "handbag", "purse", "tote"},
    "hoodie": {"hoodie", "hooded sweatshirt"},
    "jacket": {
        "bomber",
        "coat",
        "denim jacket",
        "jacket",
        "outerwear",
        "parka",
        "puffer",
        "windbreaker",
    },
    "jeans": {"denim jeans", "jean", "jeans"},
    "shirt": {"button down", "shirt"},
    "shoes": {
        "heel",
        "heels",
        "loafer",
        "loafers",
        "sandal",
        "sandals",
        "shoe",
        "shoes",
        "sneaker",
        "sneakers",
        "trainer",
        "trainers",
    },
    "shorts": {"short", "shorts"},
    "skirt": {"skirt"},
    "sweater": {"cardigan", "jumper", "sweater"},
    "tshirt": {"tee", "tshirt", "t shirt"},
    "trousers": {"cargo", "pant", "pants", "trouser", "trousers"},
}

CONDITION_MULTIPLIERS = {
    "new_with_tags": 1.0,
    "like_new": 0.9,
    "good": 0.75,
    "fair": 0.55,
}


@dataclass(frozen=True)
class PricingTarget:
    title: str
    category: str = ""
    brand: str = ""
    condition: str = ""
    seller_price: Optional[float] = None
    exclude_item_id: Optional[int] = None


@dataclass(frozen=True)
class ComparableListing:
    item_id: Optional[int]
    title: str
    price: float
    category: str = ""
    brand: str = ""
    condition: str = ""
    is_sold: bool = False
    reference_id: Optional[int] = None
    source_name: str = "Reloop marketplace"
    source_url: Optional[str] = None


class ComparableSummary(BaseModel):
    item_id: Optional[int] = None
    reference_id: Optional[int] = None
    source_name: str
    source_url: Optional[str] = None
    title: str
    price: float = Field(gt=0)
    adjusted_price: float = Field(gt=0)
    is_sold: bool


class PriceGuidance(BaseModel):
    status: PricingStatus
    currency: Literal["PKR"] = "PKR"
    confidence: PricingConfidence
    suggested_min: Optional[float] = None
    suggested_midpoint: Optional[float] = None
    suggested_max: Optional[float] = None
    seller_price_position: Optional[PricePosition] = None
    sample_count: int = Field(ge=0)
    sold_sample_count: int = Field(ge=0)
    comparable_item_ids: list[int] = Field(default_factory=list)
    comparable_reference_ids: list[int] = Field(default_factory=list)
    source_names: list[str] = Field(default_factory=list)
    comparables: list[ComparableSummary] = Field(default_factory=list)
    summary: str
    warnings: list[str] = Field(default_factory=list)
    method: Literal["reloop_comparables_v1"] = "reloop_comparables_v1"


@dataclass(frozen=True)
class _ScoredComparable:
    listing: ComparableListing
    score: float
    adjusted_price: float


def _normalize_text(value: str) -> str:
    return " ".join(re.findall(r"[a-z0-9]+", value.casefold()))


def _meaningful_tokens(value: str) -> set[str]:
    return {
        token
        for token in _normalize_text(value).split()
        if len(token) > 1 and token not in STOP_WORDS
    }


def _normalize_brand(value: str) -> str:
    brand = _normalize_text(value)
    return "" if brand in GENERIC_BRANDS else brand


def _normalize_condition(value: str) -> str:
    normalized = _normalize_text(value).replace(" ", "_")
    aliases = {
        "new": "new_with_tags",
        "new_with_tag": "new_with_tags",
        "new_with_tags": "new_with_tags",
        "like_new": "like_new",
        "excellent": "like_new",
        "good": "good",
        "used": "good",
        "fair": "fair",
        "worn": "fair",
    }
    return aliases.get(normalized, "")


def _detect_product_family(*values: str) -> Optional[str]:
    haystack = f" {_normalize_text(' '.join(values))} "

    for family, aliases in PRODUCT_FAMILIES.items():
        for alias in aliases:
            normalized_alias = _normalize_text(alias)

            if f" {normalized_alias} " in haystack:
                return family

    return None


def _percentile(values: list[float], fraction: float) -> float:
    if not values:
        raise ValueError("Cannot calculate a percentile without values.")

    ordered = sorted(values)
    position = (len(ordered) - 1) * fraction
    lower_index = math.floor(position)
    upper_index = math.ceil(position)

    if lower_index == upper_index:
        return ordered[lower_index]

    weight = position - lower_index
    return (
        ordered[lower_index] * (1 - weight)
        + ordered[upper_index] * weight
    )


def _round_pkr(value: float) -> float:
    rounded = round(value / PKR_ROUNDING_STEP) * PKR_ROUNDING_STEP
    return float(max(PKR_ROUNDING_STEP, rounded))


def _adjust_for_condition(
    price: float,
    comparable_condition: str,
    target_condition: str,
) -> float:
    comparable_key = _normalize_condition(comparable_condition)
    target_key = _normalize_condition(target_condition)

    if not comparable_key or not target_key:
        return price

    return price * (
        CONDITION_MULTIPLIERS[target_key]
        / CONDITION_MULTIPLIERS[comparable_key]
    )


def _score_comparable(
    target: PricingTarget,
    listing: ComparableListing,
) -> Optional[_ScoredComparable]:
    if (
        target.exclude_item_id is not None
        and target.exclude_item_id == listing.item_id
    ):
        return None

    if (
        not math.isfinite(listing.price)
        or listing.price < MIN_VALID_PKR_PRICE
    ):
        return None

    target_title_family = _detect_product_family(target.title)
    target_category_family = _detect_product_family(target.category)
    target_family = target_title_family or target_category_family
    listing_title_family = _detect_product_family(listing.title)
    listing_category_family = _detect_product_family(listing.category)
    listing_family = listing_title_family or listing_category_family
    target_tokens = _meaningful_tokens(target.title)
    listing_tokens = _meaningful_tokens(listing.title)
    shared_tokens = target_tokens.intersection(listing_tokens)

    if target_family:
        if listing_title_family and listing_title_family != target_family:
            return None

        if listing_family != target_family and not shared_tokens:
            return None

        if not listing_title_family and not shared_tokens:
            return None
    elif listing_family:
        if not shared_tokens:
            return None

    target_brand = _normalize_brand(target.brand)
    listing_brand = _normalize_brand(listing.brand)

    if target_brand and listing_brand and target_brand != listing_brand:
        return None

    score = 0.0

    if target_family and listing_title_family == target_family:
        score += 5.0
    elif target_family and listing_category_family == target_family:
        score += 1.0

    score += min(3.0, float(len(shared_tokens)))

    if (
        _normalize_text(target.category)
        and _normalize_text(target.category)
        == _normalize_text(listing.category)
    ):
        score += 1.5

    if target_brand:
        if listing_brand == target_brand:
            score += 3.0
        elif not listing_brand:
            score -= 0.5

    target_condition = _normalize_condition(target.condition)
    listing_condition = _normalize_condition(listing.condition)

    if target_condition and target_condition == listing_condition:
        score += 1.0

    if listing.is_sold:
        score += 1.0

    if score < 3.0:
        return None

    return _ScoredComparable(
        listing=listing,
        score=score,
        adjusted_price=_adjust_for_condition(
            listing.price,
            listing.condition,
            target.condition,
        ),
    )


def _remove_price_outliers(
    comparables: list[_ScoredComparable],
) -> list[_ScoredComparable]:
    if len(comparables) < 4:
        return comparables

    values = [item.adjusted_price for item in comparables]
    first_quartile = _percentile(values, 0.25)
    third_quartile = _percentile(values, 0.75)
    interquartile_range = third_quartile - first_quartile

    if interquartile_range <= 0:
        return comparables

    lower_bound = first_quartile - 1.5 * interquartile_range
    upper_bound = third_quartile + 1.5 * interquartile_range

    return [
        item
        for item in comparables
        if lower_bound <= item.adjusted_price <= upper_bound
    ]


def _confidence_for(
    sample_count: int,
    sold_sample_count: int,
) -> PricingConfidence:
    if sample_count >= 10 and sold_sample_count >= 5:
        return "high"

    if sample_count >= 5 and sold_sample_count >= 2:
        return "medium"

    return "low"


def _seller_price_position(
    seller_price: Optional[float],
    suggested_min: float,
    suggested_max: float,
) -> Optional[PricePosition]:
    if seller_price is None or seller_price <= 0:
        return None

    if seller_price < suggested_min:
        return "below_range"

    if seller_price > suggested_max:
        return "above_range"

    return "within_range"


def estimate_price_guidance(
    target: PricingTarget,
    listings: list[ComparableListing],
) -> PriceGuidance:
    scored = [
        comparable
        for listing in listings
        if (comparable := _score_comparable(target, listing)) is not None
    ]
    scored.sort(
        key=lambda comparable: (
            comparable.score,
            comparable.listing.is_sold,
            comparable.listing.item_id or 0,
            comparable.listing.reference_id or 0,
        ),
        reverse=True,
    )
    selected = _remove_price_outliers(scored[:MAX_COMPARABLES])
    sample_count = len(selected)
    sold_sample_count = sum(
        1 for comparable in selected if comparable.listing.is_sold
    )
    comparable_ids = [
        item.listing.item_id
        for item in selected
        if item.listing.item_id is not None
    ]
    reference_ids = [
        item.listing.reference_id
        for item in selected
        if item.listing.reference_id is not None
    ]
    source_names = sorted(
        {
            item.listing.source_name
            for item in selected
            if item.listing.source_name
        }
    )
    warnings: list[str] = []

    if sample_count < MIN_COMPARABLES:
        if sample_count == 0:
            summary = (
                "Reloop does not have enough matching Pakistan-market "
                "listings to estimate a responsible price yet."
            )
        else:
            summary = (
                f"Only {sample_count} close comparable listing"
                f"{' was' if sample_count == 1 else 's were'} found. "
                "At least three are required before suggesting a range."
            )

        warnings.append(
            "Add verified market references or wait for more comparable sales."
        )

        return PriceGuidance(
            status="insufficient_data",
            confidence="low",
            sample_count=sample_count,
            sold_sample_count=sold_sample_count,
            comparable_item_ids=comparable_ids,
            comparable_reference_ids=reference_ids,
            source_names=source_names,
            comparables=[
                ComparableSummary(
                    item_id=item.listing.item_id,
                    reference_id=item.listing.reference_id,
                    source_name=item.listing.source_name,
                    source_url=item.listing.source_url,
                    title=item.listing.title,
                    price=item.listing.price,
                    adjusted_price=round(item.adjusted_price, 2),
                    is_sold=item.listing.is_sold,
                )
                for item in selected
            ],
            summary=summary,
            warnings=warnings,
        )

    adjusted_prices = [item.adjusted_price for item in selected]
    suggested_min = _round_pkr(_percentile(adjusted_prices, 0.25))
    suggested_midpoint = _round_pkr(median(adjusted_prices))
    suggested_max = _round_pkr(_percentile(adjusted_prices, 0.75))
    suggested_min = min(suggested_min, suggested_midpoint)
    suggested_max = max(suggested_max, suggested_midpoint)
    confidence = _confidence_for(sample_count, sold_sample_count)

    if sold_sample_count == 0:
        warnings.append(
            "This range uses asking prices only; completed sales are not available."
        )

    if not _normalize_brand(target.brand):
        warnings.append(
            "No verified brand was supplied, so brand value is not included."
        )

    if not _normalize_condition(target.condition):
        warnings.append(
            "Condition was not recognized, so no condition adjustment was applied."
        )

    return PriceGuidance(
        status="ready",
        confidence=confidence,
        suggested_min=suggested_min,
        suggested_midpoint=suggested_midpoint,
        suggested_max=suggested_max,
        seller_price_position=_seller_price_position(
            target.seller_price,
            suggested_min,
            suggested_max,
        ),
        sample_count=sample_count,
        sold_sample_count=sold_sample_count,
        comparable_item_ids=comparable_ids,
        comparable_reference_ids=reference_ids,
        source_names=source_names,
        comparables=[
            ComparableSummary(
                item_id=item.listing.item_id,
                reference_id=item.listing.reference_id,
                source_name=item.listing.source_name,
                source_url=item.listing.source_url,
                title=item.listing.title,
                price=item.listing.price,
                adjusted_price=round(item.adjusted_price, 2),
                is_sold=item.listing.is_sold,
            )
            for item in selected
        ],
        summary=(
            f"Based on {sample_count} verified Pakistan-market "
            "references in PKR, "
            f"including {sold_sample_count} completed "
            f"{'sale' if sold_sample_count == 1 else 'sales'}."
        ),
        warnings=warnings,
    )
