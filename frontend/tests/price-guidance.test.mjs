import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPriceGuidanceRequest,
  getPricePosition,
  parseOptionalSellerPrice,
  requestPriceGuidance,
} from "../src/lib/price-guidance.ts";


test("normalizes a price guidance request", () => {
  assert.deepEqual(
    buildPriceGuidanceRequest({
      title: "  Blue denim jacket  ",
      category: " Outerwear ",
      brand: " Unbranded ",
      condition: " Good ",
      sellerPrice: "3500",
      excludeItemId: 2,
    }),
    {
      title: "Blue denim jacket",
      category: "Outerwear",
      brand: "Unbranded",
      condition: "Good",
      seller_price: 3500,
      exclude_item_id: 2,
    },
  );
});

test("omits invalid optional prices", () => {
  assert.equal(parseOptionalSellerPrice("not a price"), undefined);
  assert.equal(parseOptionalSellerPrice("0"), undefined);
  assert.equal(parseOptionalSellerPrice("2500"), 2500);
});

test("requires a meaningful title", () => {
  assert.throws(
    () => buildPriceGuidanceRequest({ title: " " }),
    /clear item title/i,
  );
});

test("derives the current seller price position", () => {
  assert.equal(getPricePosition("2000", 2500, 5000), "below_range");
  assert.equal(getPricePosition("3500", 2500, 5000), "within_range");
  assert.equal(getPricePosition("6000", 2500, 5000), "above_range");
  assert.equal(getPricePosition("", 2500, 5000), null);
});

test("posts the normalized request and returns guidance", async () => {
  const originalFetch = globalThis.fetch;
  let receivedBody;

  globalThis.fetch = async (_url, options) => {
    receivedBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        status: "insufficient_data",
        currency: "PKR",
        confidence: "low",
        suggested_min: null,
        suggested_midpoint: null,
        suggested_max: null,
        seller_price_position: null,
        sample_count: 0,
        sold_sample_count: 0,
        comparable_item_ids: [],
        comparable_reference_ids: [],
        source_names: [],
        comparables: [],
        summary: "Not enough data.",
        warnings: [],
        method: "reloop_comparables_v1",
      }),
    };
  };

  try {
    const response = await requestPriceGuidance({
      title: "Denim jacket",
      sellerPrice: 3500,
    });

    assert.equal(response.status, "insufficient_data");
    assert.equal(receivedBody.title, "Denim jacket");
    assert.equal(receivedBody.seller_price, 3500);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
