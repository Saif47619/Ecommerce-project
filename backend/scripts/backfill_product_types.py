import argparse
import sys
from pathlib import Path

from sqlalchemy import or_


BACKEND_DIRECTORY = Path(__file__).resolve().parents[1]

if str(BACKEND_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIRECTORY))

from database import SessionLocal
from models import Item, PricingReference
from product_types import infer_product_type


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Backfill missing product types only when an existing title or "
            "category contains a supported, unambiguous product phrase."
        )
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Commit the inferred product types. Without this flag, run a dry-run.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    db = SessionLocal()
    item_updates: list[tuple[int, str, str]] = []
    reference_updates: list[tuple[int, str, str]] = []
    unresolved_items = 0
    unresolved_references = 0

    try:
        items = (
            db.query(Item)
            .filter(
                or_(
                    Item.product_type.is_(None),
                    Item.product_type == "",
                )
            )
            .all()
        )

        for item in items:
            product_type = infer_product_type(
                item.title,
                item.category,
            )

            if not product_type:
                unresolved_items += 1
                continue

            item.product_type = product_type
            item_updates.append(
                (item.id, item.title, product_type)
            )

        references = (
            db.query(PricingReference)
            .filter(
                or_(
                    PricingReference.product_type.is_(None),
                    PricingReference.product_type == "",
                )
            )
            .all()
        )

        for reference in references:
            product_type = infer_product_type(
                reference.title,
                reference.category,
            )

            if not product_type:
                unresolved_references += 1
                continue

            reference.product_type = product_type
            reference_updates.append(
                (
                    reference.id,
                    reference.title,
                    product_type,
                )
            )

        for item_id, title, product_type in item_updates:
            print(
                f"item {item_id}: {title!r} -> {product_type}"
            )

        for reference_id, title, product_type in reference_updates:
            print(
                f"reference {reference_id}: {title!r} -> {product_type}"
            )

        if args.apply:
            db.commit()
            mode = "APPLIED"
        else:
            db.rollback()
            mode = "DRY RUN"

        print(
            f"{mode}: {len(item_updates)} items and "
            f"{len(reference_updates)} pricing references inferred."
        )
        print(
            f"Left unresolved: {unresolved_items} items and "
            f"{unresolved_references} pricing references."
        )
        return 0
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
