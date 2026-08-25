import base64

from ai_descriptions import (
    ListingDetails,
    build_listing_prompt,
    generate_listing_description,
)


class FakeInteraction:
    output_text = (
        '"A versatile burgundy jacket with a clean silhouette, '
        "ideal for layering over everyday outfits. The deep color "
        "works well with denim or neutral trousers, making it an "
        'easy choice for casual plans and cooler evenings."'
    )


class FakeInteractions:
    def __init__(self):
        self.request = None

    def create(self, **kwargs):
        self.request = kwargs
        return FakeInteraction()


class FakeClient:
    def __init__(self):
        self.interactions = FakeInteractions()


def test_prompt_uses_facts_and_warns_against_invention():
    prompt = build_listing_prompt(
        ListingDetails(
            title="Wine jacket",
            category="Outerwear",
            condition="Good",
        )
    )

    assert "Title: Wine jacket" in prompt
    assert "Category: Outerwear" in prompt
    assert "Condition: Good" in prompt
    assert "Never invent" in prompt


def test_generation_sends_image_and_returns_clean_text(
    monkeypatch,
):
    monkeypatch.setenv("GEMINI_MODEL", "test-model")

    client = FakeClient()
    image_bytes = b"test-image-bytes"

    description, model = generate_listing_description(
        image_bytes,
        "image/jpeg",
        ListingDetails(brand="Unbranded"),
        client=client,
    )

    assert model == "test-model"
    assert description.startswith(
        "A versatile burgundy jacket"
    )
    assert not description.startswith('"')

    request = client.interactions.request

    assert request["model"] == "test-model"
    assert request["input"][0]["mime_type"] == "image/jpeg"
    assert (
        base64.b64decode(request["input"][0]["data"])
        == image_bytes
    )