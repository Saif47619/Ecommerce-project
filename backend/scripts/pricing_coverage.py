from collections import defaultdict
import sys
from pathlib import Path


BACKEND_DIRECTORY = Path(__file__).resolve().parents[1]

if str(BACKEND_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIRECTORY))

from database import SessionLocal
from models import Item, PricingReference
from pricing_references import reference_cutoff
from product_types import SUPPORTED_PRODUCT_TYPES


def main() -> None:
    db = SessionLocal()

    try:
        cutoff = reference_cutoff()
        coverage = defaultdict(
            lambda: {
                "active": 0,
                "sold": 0,
                "verified": 0,
                "verified_sold": 0,
            }
        )

        for item in db.query(Item).all():
            if not item.product_type:
                continue
            key = item.product_type
            coverage[key]["sold" if item.is_sold else "active"] += 1

        references = (
            db.query(PricingReference)
            .filter(
                PricingReference.is_verified.is_(True),
                PricingReference.observed_at >= cutoff,
            )
            .all()
        )

        for reference in references:
            if not reference.product_type:
                continue
            key = reference.product_type
            coverage[key]["verified"] += 1
            if reference.reference_type == "sold":
                coverage[key]["verified_sold"] += 1

        print(
            "product_type,active_reloop,sold_reloop,"
            "verified_recent,verified_sold,status"
        )

        for product_type in sorted(SUPPORTED_PRODUCT_TYPES):
            row = coverage[product_type]
            total = row["active"] + row["sold"] + row["verified"]
            status = "covered" if total >= 3 else "needs_data"
            print(
                f"{product_type},{row['active']},{row['sold']},"
                f"{row['verified']},{row['verified_sold']},{status}"
            )
    finally:
        db.close()


if __name__ == "__main__":
    main()
