import pytest
from pydantic import ValidationError

from ai_pricing import (
    ComparableListing,
    PricingTarget,
    estimate_price_guidance,
)
from schemas import PriceGuidanceRequest


def listing(
    item_id: int,
    title: str,
    price: float,
    *,
    category: str = "Outerwear",
    product_type: str = "",
    brand: str = "",
    condition: str = "Good",
    is_sold: bool = False,
) -> ComparableListing:
    return ComparableListing(
        item_id=item_id,
        title=title,
        price=price,
        category=category,
        product_type=product_type,
        brand=brand,
        condition=condition,
        is_sold=is_sold,
    )


def market_reference(
    reference_id: int,
    title: str,
    price: float,
    *,
    source_name: str,
    source_url: str,
    category: str = "Outerwear",
    product_type: str = "",
    condition: str = "Good",
    reference_type: str = "asking",
) -> ComparableListing:
    return ComparableListing(
        item_id=None,
        reference_id=reference_id,
        source_name=source_name,
        source_url=source_url,
        title=title,
        price=price,
        category=category,
        product_type=product_type,
        condition=condition,
        is_sold=reference_type == "sold",
    )


def test_returns_insufficient_data_without_comparables():
    guidance = estimate_price_guidance(
        PricingTarget(title="Blue denim jacket"),
        [],
    )

    assert guidance.status == "insufficient_data"
    assert guidance.confidence == "low"
    assert guidance.sample_count == 0
    assert guidance.suggested_min is None
    assert "does not have enough" in guidance.summary


def test_unrelated_product_families_are_rejected():
    guidance = estimate_price_guidance(
        PricingTarget(title="Blue denim jacket"),
        [
            listing(1, "Nike running shoes", 4500, category="Shoes"),
            listing(2, "Leather boots", 6000, category="Shoes"),
            listing(3, "Black trainers", 3500, category="Shoes"),
        ],
    )

    assert guidance.status == "insufficient_data"
    assert guidance.sample_count == 0


def test_category_match_alone_does_not_make_an_item_comparable():
    guidance = estimate_price_guidance(
        PricingTarget(
            title="Blue denim jacket",
            category="Outerwear",
            condition="Good",
        ),
        [
            listing(1, "Denim jacket", 2500),
            listing(2, "Blue jacket", 3000),
            listing(3, "samfkan", 3500, is_sold=True),
        ],
    )

    assert guidance.status == "insufficient_data"
    assert set(guidance.comparable_item_ids) == {1, 2}
    assert 3 not in guidance.comparable_item_ids


def test_rejects_legacy_prices_that_are_not_plausible_pkr_values():
    guidance = estimate_price_guidance(
        PricingTarget(title="Blue denim jacket", category="Outerwear"),
        [
            listing(1, "Denim jacket", 22, is_sold=True),
            listing(2, "Blue jacket", 23, is_sold=True),
            listing(3, "Vintage jacket", 30),
        ],
    )

    assert guidance.status == "insufficient_data"
    assert guidance.sample_count == 0
    assert guidance.comparables == []


def test_builds_a_pkr_range_from_matching_comparables():
    guidance = estimate_price_guidance(
        PricingTarget(
            title="Blue denim jacket",
            category="Outerwear",
            condition="Good",
        ),
        [
            listing(1, "Denim jacket", 1000, is_sold=True),
            listing(2, "Blue denim jacket", 1200),
            listing(3, "Vintage denim jacket", 1400, is_sold=True),
        ],
    )

    assert guidance.status == "ready"
    assert guidance.currency == "PKR"
    assert guidance.suggested_min == 1100
    assert guidance.suggested_midpoint == 1200
    assert guidance.suggested_max == 1300
    assert guidance.sample_count == 3
    assert guidance.sold_sample_count == 2


def test_adjusts_comparables_to_the_target_condition():
    guidance = estimate_price_guidance(
        PricingTarget(
            title="Denim jacket",
            condition="Good",
        ),
        [
            listing(1, "Denim jacket", 550, condition="Fair"),
            listing(2, "Denim jacket", 750, condition="Good"),
            listing(3, "Denim jacket", 900, condition="Like new"),
        ],
    )

    assert guidance.status == "ready"
    assert guidance.suggested_min == 750
    assert guidance.suggested_midpoint == 750
    assert guidance.suggested_max == 750


def test_removes_an_extreme_price_outlier():
    guidance = estimate_price_guidance(
        PricingTarget(title="Denim jacket", condition="Good"),
        [
            listing(1, "Denim jacket", 1000),
            listing(2, "Denim jacket", 1050),
            listing(3, "Denim jacket", 1100),
            listing(4, "Denim jacket", 1150),
            listing(5, "Denim jacket", 10000),
        ],
    )

    assert guidance.status == "ready"
    assert guidance.sample_count == 4
    assert 5 not in guidance.comparable_item_ids
    assert guidance.suggested_max <= 1150


def test_branded_target_rejects_a_different_known_brand():
    guidance = estimate_price_guidance(
        PricingTarget(
            title="Running shoes",
            category="Shoes",
            brand="Nike",
            condition="Good",
        ),
        [
            listing(1, "Running shoes", 5000, category="Shoes", brand="Adidas"),
            listing(2, "Nike running shoes", 4000, category="Shoes", brand="Nike"),
            listing(3, "Nike trainers", 4500, category="Shoes", brand="Nike"),
            listing(4, "Nike shoes", 4200, category="Shoes", brand="Nike"),
        ],
    )

    assert guidance.status == "ready"
    assert set(guidance.comparable_item_ids) == {2, 3, 4}


@pytest.mark.parametrize(
    ("seller_price", "expected_position"),
    [
        (500, "below_range"),
        (1200, "within_range"),
        (2000, "above_range"),
    ],
)
def test_classifies_the_seller_price(
    seller_price: float,
    expected_position: str,
):
    guidance = estimate_price_guidance(
        PricingTarget(
            title="Denim jacket",
            condition="Good",
            seller_price=seller_price,
        ),
        [
            listing(1, "Denim jacket", 1000),
            listing(2, "Denim jacket", 1200),
            listing(3, "Denim jacket", 1400),
        ],
    )

    assert guidance.seller_price_position == expected_position


def test_excludes_the_item_being_edited_and_invalid_prices():
    guidance = estimate_price_guidance(
        PricingTarget(
            title="Denim jacket",
            condition="Good",
            exclude_item_id=1,
        ),
        [
            listing(1, "Denim jacket", 1000),
            listing(2, "Denim jacket", 0),
            listing(3, "Denim jacket", 1100),
            listing(4, "Denim jacket", 1200),
        ],
    )

    assert guidance.status == "insufficient_data"
    assert guidance.comparable_item_ids == [4, 3]


def test_high_confidence_requires_enough_completed_sales():
    comparables = [
        listing(
            item_id,
            "Denim jacket",
            1000 + item_id * 50,
            is_sold=item_id <= 5,
        )
        for item_id in range(1, 11)
    ]

    guidance = estimate_price_guidance(
        PricingTarget(title="Denim jacket", condition="Good"),
        comparables,
    )

    assert guidance.status == "ready"
    assert guidance.sample_count == 10
    assert guidance.sold_sample_count == 5
    assert guidance.confidence == "high"


def test_asking_price_only_range_includes_a_warning():
    guidance = estimate_price_guidance(
        PricingTarget(title="Denim jacket", condition="Good"),
        [
            listing(1, "Denim jacket", 1000),
            listing(2, "Denim jacket", 1200),
            listing(3, "Denim jacket", 1400),
        ],
    )

    assert guidance.status == "ready"
    assert guidance.sold_sample_count == 0
    assert any("asking prices only" in warning for warning in guidance.warnings)


def test_price_guidance_request_accepts_listing_context():
    request = PriceGuidanceRequest(
        title="Blue denim jacket",
        category="Outerwear",
        product_type="jacket",
        brand="Unbranded",
        condition="Good",
        seller_price=3500,
        exclude_item_id=12,
    )

    assert request.seller_price == 3500
    assert request.exclude_item_id == 12
    assert request.product_type == "jacket"


def test_explicit_product_type_prevents_cross_type_matches():
    guidance = estimate_price_guidance(
        PricingTarget(
            title="Blue item",
            category="Men",
            product_type="jacket",
        ),
        [
            listing(1, "Blue item", 3000, product_type="jacket"),
            listing(2, "Blue item", 3500, product_type="jacket"),
            listing(3, "Blue item", 4000, product_type="jacket"),
            listing(4, "Blue item", 4500, product_type="shirt"),
            listing(5, "Blue item", 5000, product_type="sneakers"),
        ],
    )

    assert guidance.status == "ready"
    assert guidance.product_type == "jacket"
    assert set(guidance.comparable_item_ids) == {1, 2, 3}


def test_product_type_alias_is_normalized():
    request = PriceGuidanceRequest(
        title="Plain tee",
        product_type="T-shirt",
    )

    assert request.product_type == "t_shirt"


@pytest.mark.parametrize(
    ("payload", "invalid_field"),
    [
        ({"title": "x"}, "title"),
        ({"title": "Denim jacket", "seller_price": 0}, "seller_price"),
        ({"title": "Denim jacket", "exclude_item_id": 0}, "exclude_item_id"),
    ],
)
def test_price_guidance_request_rejects_invalid_values(
    payload: dict,
    invalid_field: str,
):
    with pytest.raises(ValidationError) as exc_info:
        PriceGuidanceRequest(**payload)

    assert invalid_field in str(exc_info.value)


def test_reports_external_market_references_transparently():
    guidance = estimate_price_guidance(
        PricingTarget(title="Denim jacket", category="Outerwear"),
        [
            market_reference(
                101,
                "Denim jacket",
                2500,
                source_name="Market A",
                source_url="https://example.com/a",
            ),
            market_reference(
                102,
                "Blue denim jacket",
                3000,
                source_name="Market B",
                source_url="https://example.com/b",
                reference_type="sold",
            ),
            market_reference(
                103,
                "Vintage denim jacket",
                3500,
                source_name="Market A",
                source_url="https://example.com/c",
            ),
        ],
    )

    assert guidance.status == "ready"
    assert guidance.comparable_item_ids == []
    assert set(guidance.comparable_reference_ids) == {101, 102, 103}
    assert guidance.source_names == ["Market A", "Market B"]
    assert guidance.sold_sample_count == 1
    assert all(item.item_id is None for item in guidance.comparables)
    assert guidance.comparables[0].source_url
