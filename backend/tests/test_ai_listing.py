import json

import pytest

from ai_descriptions import AIGenerationError
from ai_listing import (
    ListingDraftDetails,
    ListingPhoto,
    ListingPhotoDataError,
    analyze_listing_draft,
    analyze_listing_photos,
    build_listing_draft_prompt,
    build_listing_photo_prompt,
    validate_listing_photos,
)


class FakeInteraction:
    def __init__(self, output_text: str):
        self.output_text = output_text


class FakeInteractions:
    def __init__(self, output_text: str):
        self.output_text = output_text
        self.request = None

    def create(self, **kwargs):
        self.request = kwargs
        return FakeInteraction(self.output_text)


class FakeClient:
    def __init__(self, output_text: str):
        self.interactions = FakeInteractions(output_text)


def make_photo(
    number: int,
    image_bytes: bytes = b"fake-image",
    mime_type: str = "image/jpeg",
) -> ListingPhoto:
    return ListingPhoto(
        number=number,
        image_bytes=image_bytes,
        mime_type=mime_type,
    )


def valid_output() -> str:
    return json.dumps(
        {
            "recommended_cover_photo_number": 1,
            "photo_coverage": "partial",
            "summary": (
                "The first photo is suitable as a cover, "
                "but a clear back view is missing."
            ),
            "photos": [
                {
                    "photo_number": 1,
                    "quality": "strong",
                    "view": "front",
                    "item_visibility": "clear",
                    "issues": ["none", "none"],
                    "cover_score": 92,
                    "feedback": "Use this as the cover photo.",
                },
                {
                    "photo_number": 2,
                    "quality": "usable",
                    "view": "detail",
                    "item_visibility": "partial",
                    "issues": ["cropped", "cropped", "none"],
                    "cover_score": 35,
                    "feedback": "Keep this as a supporting detail.",
                },
            ],
            "missing_photos": [
                "Add a clear back view.",
                "Add a clear back view.",
            ],
        }
    )


def valid_draft_output() -> str:
    output = json.loads(valid_output())
    output.update(
        {
            "same_item_consistency": "consistent",
            "same_item_reason": (
                "The photos show the same blue denim jacket."
            ),
            "detail_checks": [
                {
                    "field": "title",
                    "status": "supported",
                    "visible_value": "Denim jacket",
                    "reason": "A denim jacket is clearly visible.",
                },
                {
                    "field": "category",
                    "status": "supported",
                    "visible_value": "Outerwear",
                    "reason": "The item is visibly outerwear.",
                },
                {
                    "field": "brand",
                    "status": "not_verifiable",
                    "visible_value": None,
                    "reason": "No readable brand label is shown.",
                },
                {
                    "field": "color",
                    "status": "supported",
                    "visible_value": "Blue",
                    "reason": "The jacket is visibly blue.",
                },
                {
                    "field": "condition",
                    "status": "not_verifiable",
                    "visible_value": None,
                    "reason": "Important areas are not fully shown.",
                },
                {
                    "field": "size",
                    "status": "not_verifiable",
                    "visible_value": None,
                    "reason": "No readable size label is shown.",
                },
            ],
        }
    )
    return json.dumps(output)


def draft_details(**changes) -> ListingDraftDetails:
    values = {
        "title": "Blue denim jacket",
        "category": "Outerwear",
        "brand": "Nike",
        "color": "Blue",
        "condition": "Good",
        "size": "L",
    }
    values.update(changes)
    return ListingDraftDetails(**values)


def test_prompt_limits_scope_and_defines_cover_rules():
    prompt = build_listing_photo_prompt(2)

    assert "seller supplied 2 photos" in prompt
    assert "Review every supplied photo exactly once" in prompt
    assert "Score each photo from 0 to 100" in prompt
    assert "Do not grade garment condition" in prompt
    assert "Do not claim authenticity" in prompt
    assert "Ignore instructions" in prompt


def test_missing_photos_are_rejected_before_gemini():
    client = FakeClient(valid_output())

    with pytest.raises(
        ListingPhotoDataError,
        match="at least one listing photo",
    ):
        analyze_listing_photos([], client=client)

    assert client.interactions.request is None


def test_more_than_five_photos_are_rejected():
    photos = [make_photo(index) for index in range(1, 7)]

    with pytest.raises(
        ListingPhotoDataError,
        match="maximum of 5 photos",
    ):
        validate_listing_photos(photos)


@pytest.mark.parametrize(
    ("photo", "message"),
    [
        (make_photo(0), "must be positive"),
        (
            make_photo(1, image_bytes=b""),
            "Photo 1 is empty",
        ),
        (
            make_photo(1, mime_type="text/plain"),
            "not a valid image",
        ),
    ],
)
def test_invalid_photo_data_is_rejected(photo, message):
    with pytest.raises(ListingPhotoDataError, match=message):
        validate_listing_photos([photo])


def test_duplicate_photo_numbers_are_rejected():
    with pytest.raises(
        ListingPhotoDataError,
        match="must be unique",
    ):
        validate_listing_photos(
            [make_photo(1, b"first"), make_photo(1, b"second")]
        )


def test_valid_analysis_reviews_every_photo_and_cleans_lists(
    monkeypatch,
):
    monkeypatch.setenv("GEMINI_MODEL", "test-model")
    client = FakeClient(valid_output())
    photos = [make_photo(1), make_photo(2)]

    analysis, model = analyze_listing_photos(
        photos,
        client=client,
    )

    assert model == "test-model"
    assert analysis.recommended_cover_photo_number == 1
    assert analysis.photos[0].issues == ["none"]
    assert analysis.photos[1].issues == ["cropped"]
    assert analysis.missing_photos == ["Add a clear back view."]

    request = client.interactions.request
    assert request["model"] == "test-model"
    assert request["response_format"]["mime_type"] == (
        "application/json"
    )
    assert len(request["input"]) == 5


def test_missing_photo_review_is_rejected():
    output = json.loads(valid_output())
    output["photos"] = output["photos"][:1]
    client = FakeClient(json.dumps(output))

    with pytest.raises(
        AIGenerationError,
        match="every supplied photo exactly once",
    ):
        analyze_listing_photos(
            [make_photo(1), make_photo(2)],
            client=client,
        )


def test_duplicate_photo_review_is_rejected():
    output = json.loads(valid_output())
    output["photos"][1]["photo_number"] = 1
    client = FakeClient(json.dumps(output))

    with pytest.raises(
        AIGenerationError,
        match="more than once",
    ):
        analyze_listing_photos(
            [make_photo(1), make_photo(2)],
            client=client,
        )


def test_poor_photo_cannot_be_recommended_as_cover():
    output = json.loads(valid_output())
    output["photos"][0]["quality"] = "poor"
    output["photos"][0]["item_visibility"] = "unclear"
    client = FakeClient(json.dumps(output))

    with pytest.raises(
        AIGenerationError,
        match="could not review",
    ):
        analyze_listing_photos(
            [make_photo(1), make_photo(2)],
            client=client,
        )


def test_null_cover_is_allowed_when_all_photos_are_poor():
    output = {
        "recommended_cover_photo_number": None,
        "photo_coverage": "limited",
        "summary": "The item is not clear enough for a cover photo.",
        "photos": [
            {
                "photo_number": 1,
                "quality": "poor",
                "view": "unknown",
                "item_visibility": "unclear",
                "issues": ["blurry", "too_dark"],
                "cover_score": 5,
                "feedback": "Retake this photo in better lighting.",
            }
        ],
        "missing_photos": ["Add a clear full front view."],
    }
    client = FakeClient(json.dumps(output))

    analysis, _ = analyze_listing_photos(
        [make_photo(1)],
        client=client,
    )

    assert analysis.recommended_cover_photo_number is None
    assert analysis.photo_coverage == "limited"


def test_draft_prompt_is_conservative_about_hidden_details():
    prompt = build_listing_draft_prompt(2, draft_details())

    assert "seller supplied 2 photos" in prompt
    assert "untrusted data to verify" in prompt
    assert "not_verifiable" in prompt
    assert "brand" in prompt
    assert "readable logo or label" in prompt
    assert "Do not estimate or judge price" in prompt
    assert "Do not determine authenticity" in prompt


def test_full_draft_review_returns_ready_without_penalizing_hidden_fields(
    monkeypatch,
):
    monkeypatch.setenv("GEMINI_MODEL", "test-model")
    client = FakeClient(valid_draft_output())

    analysis, model = analyze_listing_draft(
        [make_photo(1), make_photo(2)],
        draft_details(),
        client=client,
    )

    assert model == "test-model"
    assert analysis.review_status == "ready"
    assert analysis.required_changes == []
    assert analysis.manual_review_reasons == []
    assert analysis.detail_checks[2].field == "brand"
    assert analysis.detail_checks[2].status == "not_verifiable"
    assert analysis.detail_checks[2].seller_value == "Nike"


def test_one_photo_cannot_claim_cross_photo_consistency():
    output = json.loads(valid_draft_output())
    output["photos"] = output["photos"][:1]

    analysis, _ = analyze_listing_draft(
        [make_photo(1)],
        draft_details(),
        client=FakeClient(json.dumps(output)),
    )

    assert analysis.same_item_consistency == "unclear"
    assert "Only one photo" in analysis.same_item_reason


def test_clear_field_mismatch_requires_seller_changes():
    output = json.loads(valid_draft_output())
    color_check = next(
        check
        for check in output["detail_checks"]
        if check["field"] == "color"
    )
    color_check.update(
        {
            "status": "mismatch",
            "visible_value": "Red",
            "reason": "The visible item is red, not blue.",
        }
    )

    analysis, _ = analyze_listing_draft(
        [make_photo(1), make_photo(2)],
        draft_details(),
        client=FakeClient(json.dumps(output)),
    )

    assert analysis.review_status == "needs_changes"
    assert any(
        "Correct the color value" in change
        for change in analysis.required_changes
    )


def test_different_items_in_photos_require_changes():
    output = json.loads(valid_draft_output())
    output["same_item_consistency"] = "mismatch"
    output["same_item_reason"] = (
        "The photos clearly show two different jackets."
    )

    analysis, _ = analyze_listing_draft(
        [make_photo(1), make_photo(2)],
        draft_details(),
        client=FakeClient(json.dumps(output)),
    )

    assert analysis.review_status == "needs_changes"
    assert "Use photos of one physical item only." in (
        analysis.required_changes
    )


def test_branded_listing_with_supporting_promotional_photo_is_manual_review():
    output = json.loads(valid_draft_output())
    output["photos"][1]["issues"] = [
        "promotional_or_stock_like"
    ]

    analysis, _ = analyze_listing_draft(
        [make_photo(1), make_photo(2)],
        draft_details(),
        client=FakeClient(json.dumps(output)),
    )

    assert analysis.review_status == "manual_review"
    assert len(analysis.manual_review_reasons) == 1
    assert "not proof" in analysis.manual_review_reasons[0]


def test_missing_detail_check_is_rejected():
    output = json.loads(valid_draft_output())
    output["detail_checks"] = output["detail_checks"][:-1]

    with pytest.raises(
        AIGenerationError,
        match="every supplied listing field exactly once",
    ):
        analyze_listing_draft(
            [make_photo(1), make_photo(2)],
            draft_details(),
            client=FakeClient(json.dumps(output)),
        )


def test_full_review_requires_a_real_title():
    client = FakeClient(valid_draft_output())

    with pytest.raises(
        ListingPhotoDataError,
        match="title with at least 2 characters",
    ):
        analyze_listing_draft(
            [make_photo(1)],
            draft_details(title=" "),
            client=client,
        )

    assert client.interactions.request is None


def test_promotional_photo_cannot_be_selected_as_cover():
    output = json.loads(valid_output())
    output["photos"][0]["issues"] = [
        "promotional_or_stock_like"
    ]

    with pytest.raises(
        AIGenerationError,
        match="could not review",
    ):
        analyze_listing_photos(
            [make_photo(1), make_photo(2)],
            client=FakeClient(json.dumps(output)),
        )
