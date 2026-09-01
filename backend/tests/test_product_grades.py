import pytest

from product_grades import (
    GRADE_DEFINITIONS,
    derive_reloop_grade,
    grade_label,
)


@pytest.mark.parametrize(
    ("visual_grade", "expected"),
    (
        ("like_new", "A"),
        ("good", "B"),
        ("fair", "C"),
        ("worn", "D"),
    ),
)
def test_reliable_evidence_maps_to_a_through_d(
    visual_grade,
    expected,
):
    decision = derive_reloop_grade(
        visual_grade=visual_grade,
        photo_coverage="partial",
        confidence="medium",
        seller_condition_consistency="consistent",
    )

    assert decision.grade == expected
    assert decision.status == "graded"


@pytest.mark.parametrize(
    "unsafe_field",
    (
        {"photo_coverage": "limited"},
        {"confidence": "low"},
        {
            "seller_condition_consistency": (
                "review_recommended"
            )
        },
    ),
)
def test_weak_or_conflicting_evidence_stays_unverified(
    unsafe_field,
):
    evidence = {
        "visual_grade": "like_new",
        "photo_coverage": "strong",
        "confidence": "high",
        "seller_condition_consistency": "consistent",
    }
    evidence.update(unsafe_field)

    decision = derive_reloop_grade(**evidence)

    assert decision.grade == "U"
    assert decision.status == "needs_photos"


def test_unknown_visual_grade_fails_closed():
    decision = derive_reloop_grade(
        visual_grade="unexpected",
        photo_coverage="strong",
        confidence="high",
        seller_condition_consistency="consistent",
    )

    assert decision.grade == "U"
    assert decision.status == "needs_photos"


def test_grade_guide_contains_each_public_grade_once():
    grades = [entry["grade"] for entry in GRADE_DEFINITIONS]

    assert grades == ["A", "B", "C", "D", "U"]
    assert grade_label(None) == "Unverified"
