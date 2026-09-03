import assert from "node:assert/strict";
import test from "node:test";

import {
  automaticGradeMessage,
  automaticallyGradeItem,
} from "../src/lib/automatic-grading.ts";

test("keeps a listing unverified without calling AI when it has no photos", async () => {
  let called = false;

  const result = await automaticallyGradeItem(
    12,
    3,
    false,
    async () => {
      called = true;
      throw new Error("fetch should not run");
    },
  );

  assert.equal(called, false);
  assert.equal(result.attempted, false);
  assert.equal(result.grade.reloop_grade, "U");
  assert.match(result.message, /Unverified/);
});

test("requests an owner-protected grade after photos are saved", async () => {
  const requests = [];

  const result = await automaticallyGradeItem(
    12,
    3,
    true,
    async (url, init) => {
      requests.push({ url, init });
      return {
        ok: true,
        json: async () => ({
          grade: {
            reloop_grade: "B",
            grade_label: "Very good",
            grade_status: "graded",
            grade_confidence: "high",
          },
        }),
      };
    },
  );

  assert.equal(requests.length, 1);
  assert.match(requests[0].url, /items\/12\/condition-passport/);
  assert.match(requests[0].url, /owner_id=3/);
  assert.equal(requests[0].init.method, "POST");
  assert.equal(result.attempted, true);
  assert.equal(result.grade.reloop_grade, "B");
  assert.match(result.message, /Grade B/);
});

test("explains a conservative unverified result", () => {
  const message = automaticGradeMessage({
    reloop_grade: "U",
    grade_label: "Unverified",
    grade_status: "needs_photos",
  });

  assert.match(message, /clearer, more complete photos/);
});

test("does not trust an A-D letter unless backend status is graded", () => {
  const message = automaticGradeMessage({
    reloop_grade: "A",
    grade_label: "Like new",
    grade_status: "stale",
  });

  assert.match(message, /Unverified/);
  assert.doesNotMatch(message, /Grade A/);
});

test("surfaces the backend reason when automatic grading fails", async () => {
  await assert.rejects(
    () =>
      automaticallyGradeItem(
        12,
        3,
        true,
        async () => ({
          ok: false,
          json: async () => ({
            detail: "Add at least one clear listing photo.",
          }),
        }),
      ),
    /Add at least one clear listing photo/,
  );
});
