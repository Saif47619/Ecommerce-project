import assert from "node:assert/strict";
import test from "node:test";

import {
  applyRecommendedCover,
  reviewListingDraft,
} from "../src/lib/ai-listing.ts";


function makeAnalysis(recommendedCover) {
  return {
    recommended_cover_photo_number: recommendedCover,
    photo_coverage: "partial",
    summary: "Test review",
    photos: [
      {
        photo_number: 1,
        quality: "usable",
        view: "front",
        item_visibility: "clear",
        issues: [],
        cover_score: 10,
        feedback: "First",
      },
      {
        photo_number: 2,
        quality: "usable",
        view: "side",
        item_visibility: "clear",
        issues: [],
        cover_score: 20,
        feedback: "Second",
      },
      {
        photo_number: 3,
        quality: "strong",
        view: "front",
        item_visibility: "clear",
        issues: [],
        cover_score: 90,
        feedback: "Third",
      },
    ],
    missing_photos: [],
  };
}


test("moves the seller-approved recommended cover to first place", () => {
  const result = applyRecommendedCover(
    ["first.jpg", "second.jpg", "third.jpg"],
    makeAnalysis(3),
  );

  assert.deepEqual(result.imageUris, [
    "third.jpg",
    "first.jpg",
    "second.jpg",
  ]);
  assert.equal(result.analysis.recommended_cover_photo_number, 1);
  assert.deepEqual(
    result.analysis.photos.map((photo) => photo.cover_score),
    [90, 10, 20],
  );
  assert.deepEqual(
    result.analysis.photos.map((photo) => photo.photo_number),
    [1, 2, 3],
  );
});


test("keeps the order when the first photo is already recommended", () => {
  const imageUris = ["first.jpg", "second.jpg", "third.jpg"];
  const analysis = makeAnalysis(1);
  const result = applyRecommendedCover(imageUris, analysis);

  assert.equal(result.imageUris, imageUris);
  assert.equal(result.analysis, analysis);
});


test("keeps the order when no safe cover was recommended", () => {
  const imageUris = ["first.jpg", "second.jpg", "third.jpg"];
  const analysis = makeAnalysis(null);
  const result = applyRecommendedCover(imageUris, analysis);

  assert.equal(result.imageUris, imageUris);
  assert.equal(result.analysis, analysis);
});


test("rejects a stale cover recommendation", () => {
  assert.throws(
    () =>
      applyRecommendedCover(
        ["first.jpg", "second.jpg", "third.jpg"],
        makeAnalysis(4),
      ),
    /no longer matches/,
  );
});


test("preserves full listing-review fields after applying a cover", () => {
  const analysis = {
    ...makeAnalysis(3),
    same_item_consistency: "consistent",
    same_item_reason: "All photos show the same item.",
    detail_checks: [],
    review_status: "needs_changes",
    required_changes: ["Add a back photo."],
    manual_review_reasons: [],
  };

  const result = applyRecommendedCover(
    ["first.jpg", "second.jpg", "third.jpg"],
    analysis,
  );

  assert.equal(result.analysis.review_status, "needs_changes");
  assert.deepEqual(
    result.analysis.required_changes,
    ["Add a back photo."],
  );
});


test("requires a title before attempting the full listing review", async () => {
  await assert.rejects(
    reviewListingDraft(
      ["photo.jpg"],
      {
        title: " ",
        category: "Outerwear",
        brand: "Unbranded",
        color: "Blue",
        condition: "Good",
        size: "L",
      },
    ),
    /clear item title/,
  );
});
