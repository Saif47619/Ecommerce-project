import re
from typing import Optional


SUPPORTED_PRODUCT_TYPES = {
    "t_shirt",
    "polo",
    "shirt",
    "blouse",
    "kurta",
    "shalwar_kameez",
    "hoodie",
    "sweater",
    "jacket",
    "coat",
    "blazer",
    "jeans",
    "trousers",
    "shorts",
    "skirt",
    "dress",
    "activewear",
    "sneakers",
    "formal_shoes",
    "sandals",
    "heels",
    "boots",
    "handbag",
    "backpack",
    "belt",
    "cap_hat",
    "scarf_shawl",
    "sunglasses",
    "jewellery",
    "watch",
}


PRODUCT_TYPE_ALIASES: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("shalwar_kameez", ("shalwar kameez", "salwar kameez", "shalwar suit")),
    ("formal_shoes", ("formal shoes", "dress shoes", "oxford shoes", "loafers", "loafer")),
    ("scarf_shawl", ("scarf", "shawl", "dupatta", "stole")),
    ("cap_hat", ("baseball cap", "cap", "hat", "beanie")),
    ("t_shirt", ("t shirt", "tshirt", "tee shirt", "tee")),
    ("sneakers", ("running shoes", "sports shoes", "trainers", "trainer", "sneakers", "sneaker")),
    ("activewear", ("tracksuit", "track suit", "gym wear", "activewear", "sportswear")),
    ("handbag", ("handbag", "hand bag", "purse", "tote bag", "clutch")),
    ("backpack", ("backpack", "rucksack", "school bag")),
    ("jewellery", ("jewellery", "jewelry", "necklace", "bracelet", "earrings", "ring")),
    ("sunglasses", ("sunglasses", "sun glasses", "shades")),
    ("trousers", ("cargo pants", "cargo", "trousers", "trouser", "pants", "pant")),
    ("sweater", ("sweater", "cardigan", "jumper", "pullover")),
    ("jacket", ("denim jacket", "bomber jacket", "puffer jacket", "windbreaker", "parka", "jacket")),
    ("shirt", ("button down shirt", "button up shirt", "dress shirt", "shirt")),
    ("polo", ("polo shirt", "polo")),
    ("blouse", ("blouse", "women top", "ladies top")),
    ("kurta", ("kurta", "kurti")),
    ("hoodie", ("hooded sweatshirt", "hoodie")),
    ("coat", ("overcoat", "trench coat", "coat")),
    ("blazer", ("suit jacket", "blazer")),
    ("jeans", ("denim jeans", "jeans", "jean")),
    ("shorts", ("shorts", "short")),
    ("skirt", ("skirt",)),
    ("dress", ("maxi dress", "dress", "frock", "gown")),
    ("sandals", ("sandals", "sandal", "slides", "slippers")),
    ("heels", ("high heels", "heels", "heel")),
    ("boots", ("ankle boots", "boots", "boot")),
    ("belt", ("belt",)),
    ("watch", ("wrist watch", "watch")),
)


def _normalize(value: object) -> str:
    return "_".join(re.findall(r"[a-z0-9]+", str(value or "").casefold()))


def normalize_product_type(
    value: object,
    *,
    strict: bool = True,
) -> str:
    normalized = _normalize(value)

    if not normalized:
        return ""

    if normalized in SUPPORTED_PRODUCT_TYPES:
        return normalized

    spaced = normalized.replace("_", " ")

    for product_type, aliases in PRODUCT_TYPE_ALIASES:
        if spaced in aliases:
            return product_type

    if strict:
        raise ValueError(
            "Unsupported product_type. Choose one of: "
            + ", ".join(sorted(SUPPORTED_PRODUCT_TYPES))
        )

    return ""


def infer_product_type(*values: object) -> Optional[str]:
    haystack = " " + " ".join(
        re.findall(
            r"[a-z0-9]+",
            " ".join(str(value or "") for value in values).casefold(),
        )
    ) + " "

    for product_type, aliases in PRODUCT_TYPE_ALIASES:
        for alias in aliases:
            normalized_alias = " ".join(re.findall(r"[a-z0-9]+", alias.casefold()))
            if f" {normalized_alias} " in haystack:
                return product_type

    return None
