from datetime import datetime, timedelta

import pytest

from pricing_references import (
    ImportSummary,
    MAX_REFERENCE_AGE_DAYS,
    load_pricing_reference_csv,
    reference_cutoff,
)


CSV_HEADER = (
    "source_name,source_listing_id,source_url,title,category,brand,"
    "condition,price_pkr,reference_type,observed_at\n"
)


def write_csv(tmp_path, contents: str):
    path = tmp_path / "references.csv"
    path.write_text(contents, encoding="utf-8")
    return path


def test_loads_a_human_reviewed_reference_csv(tmp_path):
    path = write_csv(
        tmp_path,
        CSV_HEADER
        + (
            "Market A,item-1,https://example.com/item-1,Blue denim jacket,"
            "Outerwear,Unbranded,Good,3500,asking,2026-08-15T12:30:00\n"
        ),
    )

    rows = load_pricing_reference_csv(path)

    assert len(rows) == 1
    assert rows[0].source_name == "Market A"
    assert rows[0].price_pkr == 3500
    assert rows[0].reference_type == "asking"
    assert rows[0].observed_at == datetime(2026, 8, 15, 12, 30)


def test_rejects_missing_required_columns(tmp_path):
    path = write_csv(tmp_path, "title,price_pkr\nJacket,3500\n")

    with pytest.raises(ValueError, match="missing columns"):
        load_pricing_reference_csv(path)


@pytest.mark.parametrize(
    "row",
    [
        (
            "Market A,item-1,https://example.com/item-1,Jacket,Outerwear,,,"
            "99,asking,2026-08-15T12:30:00\n"
        ),
        (
            "Market A,item-1,ftp://example.com/item-1,Jacket,Outerwear,,,"
            "3500,asking,2026-08-15T12:30:00\n"
        ),
        (
            "Market A,item-1,https://example.com/item-1,Jacket,Outerwear,,,"
            "3500,estimated,2026-08-15T12:30:00\n"
        ),
    ],
)
def test_rejects_untrusted_reference_values(tmp_path, row):
    path = write_csv(tmp_path, CSV_HEADER + row)

    with pytest.raises(ValueError, match="Invalid pricing reference"):
        load_pricing_reference_csv(path)


def test_rejects_an_empty_reference_file(tmp_path):
    path = write_csv(tmp_path, CSV_HEADER)

    with pytest.raises(ValueError, match="does not contain any data rows"):
        load_pricing_reference_csv(path)


def test_rejects_duplicate_source_listing_ids(tmp_path):
    row = (
        "Market A,item-1,https://example.com/item-1,Jacket,Outerwear,,,"
        "3500,asking,2026-08-15T12:30:00\n"
    )
    path = write_csv(tmp_path, CSV_HEADER + row + row)

    with pytest.raises(ValueError, match="Duplicate pricing reference"):
        load_pricing_reference_csv(path)


def test_normalizes_timezone_aware_observation_to_utc(tmp_path):
    path = write_csv(
        tmp_path,
        CSV_HEADER
        + (
            "Market A,item-1,https://example.com/item-1,Jacket,Outerwear,,,"
            "3500,asking,2026-08-15T17:30:00+05:00\n"
        ),
    )

    rows = load_pricing_reference_csv(path)

    assert rows[0].observed_at == datetime(2026, 8, 15, 12, 30)


def test_reference_cutoff_is_ninety_days():
    now = datetime(2026, 9, 1, 12, 0)

    assert reference_cutoff(now) == now - timedelta(
        days=MAX_REFERENCE_AGE_DAYS
    )


def test_import_summary_reports_the_total():
    summary = ImportSummary(created=4, updated=3)

    assert summary.total == 7
