import assert from "node:assert/strict";
import test from "node:test";

import {
  rankItemsForAiSearch,
} from "../src/lib/ai-search-ranking.ts";

const ITEMS = [
  {
    id: 1,
    title: "Denim Jacket",
    description: "Vintage wash everyday jacket",
    category: "Men",
    brand: "Unbranded",
    color: null,
    size: "L",
    condition: "Good",
    price: 2200,
  },
  {
    id: 2,
    title: "Air Max Shoes",
    description: "Comfortable running trainers",
    category: "Outerwear",
    brand: "Nike",
    color: "Black",
    size: "L",
    condition: "Good",
    price: 3000,
  },
  {
    id: 3,
    title: "Leather Handbag",
    description: "Small everyday bag",
    category: "Accessories",
    brand: "Unbranded",
    color: "Brown",
    size: null,
    condition: "Like new",
    price: 1500,
  },
];

function createIntent(overrides = {}) {
  return {
    summary: "Test search",
    keywords: [],
    category: null,
    brand: null,
    color: null,
    size: null,
    condition: null,
    min_price: null,
    max_price: null,
    ...overrides,
  };
}

function resultIds(results) {
  return results.map((item) => item.id);
}

test(
  "finds a denim jacket from its title despite missing color and mismatched category",
  () => {
    const results = rankItemsForAiSearch(
      ITEMS,
      "blue denim jacket size L under 4000",
      createIntent({
        keywords: ["denim", "jacket"],
        category: "Outerwear",
        color: "blue",
        size: "L",
        max_price: 4000,
      }),
    );

    assert.deepEqual(resultIds(results), [1]);
  },
);

test(
  "does not include unrelated items from category bonus alone",
  () => {
    const results = rankItemsForAiSearch(
      ITEMS,
      "denim jacket",
      createIntent({
        keywords: ["denim", "jacket"],
        category: "Outerwear",
      }),
    );

    assert.deepEqual(resultIds(results), [1]);
  },
);

test(
  "finds shoes by title even when their saved category is wrong",
  () => {
    const results = rankItemsForAiSearch(
      ITEMS,
      "shoes under 4000",
      createIntent({
        keywords: ["shoes"],
        category: "Shoes",
        max_price: 4000,
      }),
    );

    assert.deepEqual(resultIds(results), [2]);
  },
);

test(
  "finds an item by an explicitly requested brand",
  () => {
    const results = rankItemsForAiSearch(
      ITEMS,
      "Nike",
      createIntent({
        keywords: ["nike"],
        brand: "Nike",
      }),
    );

    assert.deepEqual(resultIds(results), [2]);
  },
);

test(
  "keeps price limits as strict requirements",
  () => {
    const results = rankItemsForAiSearch(
      ITEMS,
      "denim jacket under 2000",
      createIntent({
        keywords: ["denim", "jacket"],
        category: "Outerwear",
        max_price: 2000,
      }),
    );

    assert.deepEqual(resultIds(results), []);
  },
);

test(
  "supports Roman Urdu filler words",
  () => {
    const results = rankItemsForAiSearch(
      ITEMS,
      "mujhe denim jacket chahiye",
      createIntent({
        keywords: ["denim", "jacket"],
        category: "Outerwear",
      }),
    );

    assert.deepEqual(resultIds(results), [1]);
  },
);

test(
  "returns all price-qualified items for a price-only request",
  () => {
    const results = rankItemsForAiSearch(
      ITEMS,
      "under 2500",
      createIntent({
        max_price: 2500,
      }),
    );

    assert.deepEqual(resultIds(results), [1, 3]);
  },
);