from dataclasses import dataclass
from typing import Literal


ReloopGrade = Literal["A", "B", "C", "D", "U"]
GradeStatus = Literal[
    "graded",
    "needs_photos",
    "stale",
    "unverified",
]

GRADE_VERSION = "1"
GRADE_DISCLAIMER = (
    "Reloop Grade describes visible condition from listing photos. "
    "It is not an authenticity check or a physical inspection."
)

GRADE_DEFINITIONS = (
    {
        "grade": "A",
        "label": "Like new",
        "description": (
            "No meaningful visible wear in sufficiently clear photos."
        ),
    },
    {
        "grade": "B",
        "label": "Very good",
        "description": (
            "Light visible wear; clean and ready to use."
        ),
    },
    {
        "grade": "C",
        "label": "Good",
        "description": (
            "Noticeable wear or minor flaws, but still usable."
        ),
    },
    {
        "grade": "D",
        "label": "Well worn",
        "description": (
            "Heavy wear, damage, or repair needs are visible."
        ),
    },
    {
        "grade": "U",
        "label": "Unverified",
        "description": (
            "Not enough reliable photo evidence to assign A-D."
        ),
    },
)

GRADE_LABELS = {
    definition["grade"]: definition["label"]
    for definition in GRADE_DEFINITIONS
}


@dataclass(frozen=True)
class GradeDecision:
    grade: ReloopGrade
    status: GradeStatus
    label: str


def derive_reloop_grade(
    *,
    visual_grade: str,
    photo_coverage: str,
    confidence: str,
    seller_condition_consistency: str,
) -> GradeDecision:
    """Convert validated condition evidence into a conservative grade."""

    evidence_is_unsafe = (
        photo_coverage == "limited"
        or confidence == "low"
        or seller_condition_consistency == "review_recommended"
    )

    if evidence_is_unsafe:
        return GradeDecision(
            grade="U",
            status="needs_photos",
            label=GRADE_LABELS["U"],
        )

    grade_by_visual_condition: dict[str, ReloopGrade] = {
        "like_new": "A",
        "good": "B",
        "fair": "C",
        "worn": "D",
    }
    grade = grade_by_visual_condition.get(
        visual_grade,
        "U",
    )

    return GradeDecision(
        grade=grade,
        status=(
            "graded"
            if grade != "U"
            else "needs_photos"
        ),
        label=GRADE_LABELS[grade],
    )


def grade_label(grade: str | None) -> str:
    return GRADE_LABELS.get(
        (grade or "U").upper(),
        GRADE_LABELS["U"],
    )
