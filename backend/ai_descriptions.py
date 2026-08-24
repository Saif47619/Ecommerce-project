import base64
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Mapping, Optional

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parent / ".env")

DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite"
MAX_DESCRIPTION_LENGTH = 1200


class AIConfigurationError(RuntimeError):
    pass


class AIGenerationError(RuntimeError):
    pass


@dataclass(frozen=True)
class ListingDetails:
    title: str = ""
    category: str = ""
    brand: str = ""
    condition: str = ""
    color: str = ""
    size: str = ""


def build_listing_prompt(details: ListingDetails) -> str:
    provided_details: Mapping[str, str] = {
        "Title": details.title,
        "Category": details.category,
        "Brand": details.brand,
        "Condition": details.condition,
        "Color": details.color,
        "Size": details.size,
    }

    facts = "\n".join(
        f"- {label}: {value.strip()}"
        for label, value in provided_details.items()
        if value and value.strip()
    )

    if not facts:
        facts = "- No seller-provided details yet. Use only what is clearly visible."

    return f"""You write accurate secondhand-fashion listings for Reloop.

Study the photo and use the seller-provided facts below:
{facts}

Write one polished listing description of 35-60 words. Mention the visible style and practical outfit uses. Use a warm, trustworthy seller voice. Do not use markdown, headings, hashtags, emojis, prices, or shipping claims. Never invent a brand, material, size, condition, authenticity claim, or flaw. If a detail is uncertain, leave it out. Return only the description."""


def generate_listing_description(
    image_bytes: bytes,
    mime_type: str,
    details: ListingDetails,
    *,
    client: Optional[object] = None,
) -> tuple[str, str]:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

    if not api_key and client is None:
        raise AIConfigurationError(
            "Gemini is not configured. Set GEMINI_API_KEY on the backend."
        )

    model = os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODEL)

    if client is None:
        try:
            from google import genai
        except ImportError as exc:
            raise AIConfigurationError(
                "The google-genai package is not installed."
            ) from exc

        client = genai.Client(api_key=api_key)

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    try:
        interaction = client.interactions.create(
            model=model,
            input=[
                {
                    "type": "image",
                    "data": image_b64,
                    "mime_type": mime_type,
                },
                {
                    "type": "text",
                    "text": build_listing_prompt(details),
                },
            ],
        )
        description = (interaction.output_text or "").strip().strip('"')
    except Exception as exc:
        raise AIGenerationError(
            "Gemini could not generate a description. Try again in a moment."
        ) from exc

    if not description:
        raise AIGenerationError("Gemini returned an empty description. Try again.")

    return description[:MAX_DESCRIPTION_LENGTH], model