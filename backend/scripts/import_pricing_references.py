import argparse
import sys
from pathlib import Path


BACKEND_DIRECTORY = Path(__file__).resolve().parents[1]

if str(BACKEND_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIRECTORY))

from database import SessionLocal
from pricing_references import (
    load_pricing_reference_csv,
    upsert_pricing_references,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Import human-reviewed Pakistan-market price references."
        )
    )
    parser.add_argument("--file", required=True, help="Path to the CSV file")
    parser.add_argument(
        "--verified-by",
        required=True,
        help="Name or email of the human reviewer",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate the CSV without changing the database",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    rows = load_pricing_reference_csv(args.file)

    if args.dry_run:
        print(f"Validated {len(rows)} pricing references; no rows imported.")
        return 0

    db = SessionLocal()

    try:
        summary = upsert_pricing_references(
            db,
            rows,
            verified_by=args.verified_by,
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    print(
        f"Imported {summary.total} pricing references "
        f"({summary.created} created, {summary.updated} updated)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
