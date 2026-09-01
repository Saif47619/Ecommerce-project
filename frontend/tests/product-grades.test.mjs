import assert from "node:assert/strict";
import test from "node:test";

import {
  GRADE_DEFINITIONS,
  getGradeDisplay,
  normalizeGrade,
} from "../src/lib/product-grades.ts";

test("publishes the complete A-D and U guide", () => {
  assert.deepEqual(
    GRADE_DEFINITIONS.map((entry) => entry.grade),
    ["A", "B", "C", "D", "U"],
  );
});

test("normalizes unknown or missing grades to U", () => {
  assert.equal(normalizeGrade(undefined), "U");
  assert.equal(normalizeGrade("unknown"), "U");
  assert.equal(normalizeGrade("b"), "B");
});

test("forces a stale product to display as unverified", () => {
  const display = getGradeDisplay({
    reloop_grade: "A",
    grade_status: "stale",
    grade_label: "Like new",
  });

  assert.equal(display.grade, "U");
  assert.equal(display.status, "stale");
});

test("keeps a trusted backend grade and label", () => {
  const display = getGradeDisplay({
    reloop_grade: "C",
    grade_status: "graded",
    grade_label: "Good",
  });

  assert.equal(display.grade, "C");
  assert.equal(display.label, "Good");
});
