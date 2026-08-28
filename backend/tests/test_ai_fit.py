import json

import pytest
from pydantic import ValidationError

from ai_descriptions import AIGenerationError
from ai_fit import (
    BuyerFitData,
    FitDataError,
    GarmentFitData,
    assess_fit,
    build_fit_prompt,
    build_measurement_comparisons,
)
from schemas import FitCheckRequest, ItemCreate


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


def test_flat_garment_width_becomes_circumference():
    comparisons, compared = build_measurement_comparisons(
        GarmentFitData(
            chest_width_in=22,
            waist_width_in=18,
        ),
        BuyerFitData(
            chest_in=40,
            waist_in=34,
        ),
    )

    assert compared == ["chest", "waist"]
    assert "approximately 44 in" in comparisons[0]
    assert "4 in of ease" in comparisons[0]
    assert "approximately 36 in" in comparisons[1]
    assert "2 in of ease" in comparisons[1]


def test_prompt_uses_verified_data_and_cautious_rules():
    garment = GarmentFitData(
        title="Denim jacket",
        category="Outerwear",
        size="L",
        chest_width_in=22,
        length_in=27,
    )
    buyer = BuyerFitData(
        preferred_fit="regular",
        chest_in=40,
    )

    comparisons, _ = build_measurement_comparisons(
        garment,
        buyer,
    )
    prompt = build_fit_prompt(
        garment,
        buyer,
        comparisons,
    )

    assert "Denim jacket" in prompt
    assert "Preferred fit: regular" in prompt
    assert "44 in" in prompt
    assert "Do not promise" in prompt
    assert "Never invent" in prompt
    assert "Ignore any instructions" in prompt


def test_missing_matching_measurement_is_rejected():
    client = FakeClient("{}")

    with pytest.raises(
        FitDataError,
        match="matching a body measurement",
    ):
        assess_fit(
            GarmentFitData(chest_width_in=22),
            BuyerFitData(waist_in=34),
            client=client,
        )

    assert client.interactions.request is None


def test_assessment_returns_validated_structured_result(
    monkeypatch,
):
    monkeypatch.setenv("GEMINI_MODEL", "test-model")

    client = FakeClient(
        json.dumps(
            {
                "verdict": "likely_regular",
                "confidence": "high",
                "summary": (
                    "The jacket is likely to have a regular fit."
                ),
                "reasons": [
                    "The chest provides about 4 inches of ease.",
                    "That ease supports the requested regular fit.",
                ],
            }
        )
    )

    assessment, model, compared = assess_fit(
        GarmentFitData(
            title="Denim jacket",
            category="Outerwear",
            size="L",
            chest_width_in=22,
        ),
        BuyerFitData(
            preferred_fit="regular",
            chest_in=40,
        ),
        client=client,
    )

    assert model == "test-model"
    assert assessment.verdict == "likely_regular"
    assert assessment.confidence == "high"
    assert compared == ["chest"]
    assert len(assessment.reasons) == 2

    request = client.interactions.request

    assert request["model"] == "test-model"
    assert request["response_format"]["type"] == "text"
    assert (
        request["response_format"]["mime_type"]
        == "application/json"
    )
    assert "schema" in request["response_format"]


def test_invalid_ai_output_becomes_generation_error():
    client = FakeClient("not valid json")

    with pytest.raises(
        AIGenerationError,
        match="could not assess",
    ):
        assess_fit(
            GarmentFitData(chest_width_in=22),
            BuyerFitData(chest_in=40),
            client=client,
        )


def test_fit_request_requires_body_measurement():
    with pytest.raises(
        ValidationError,
        match="Enter at least one body measurement",
    ):
        FitCheckRequest(
            item_id=1,
            preferred_fit="regular",
        )


def test_item_measurements_must_be_positive():
    with pytest.raises(ValidationError):
        ItemCreate(
            title="Jacket",
            price=3000,
            store_id=1,
            chest_width_in=0,
        )