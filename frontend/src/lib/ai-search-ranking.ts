import type { AISearchIntent } from "./ai-search";

export type SearchableItem = {
  id: number;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  brand?: string | null;
  color?: string | null;
  size?: string | null;
  condition?: string | null;
  price?: number | string | null;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "i",
  "in",
  "is",
  "me",
  "my",
  "need",
  "of",
  "or",
  "the",
  "to",
  "want",
  "with",
  "looking",
  "under",
  "below",
  "above",
  "over",
  "size",
  "rs",
  "pkr",
  "rupee",
  "rupees",
  "mujhe",
  "chahiye",
  "ke",
  "ki",
  "ka",
  "ko",
  "liye",
  "mein",
  "aur",
  "tak",
]);

function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

function getSearchTerms(
  originalQuery: string,
  intent: AISearchIntent,
): string[] {
  const source = [
    originalQuery,
    ...intent.keywords,
  ]
    .map(normalize)
    .join(" ");

  return Array.from(
    new Set(
      source
        .split(" ")
        .filter(
          (term) =>
            term.length >= 2 &&
            !STOP_WORDS.has(term) &&
            !/^\d+(?:\.\d+)?$/.test(term),
        ),
    ),
  );
}

function fieldContains(
  fieldValue: unknown,
  expectedValue: string | null,
): boolean {
  if (!expectedValue) {
    return false;
  }

  const field = normalize(fieldValue);
  const expected = normalize(expectedValue);

  return Boolean(
    field &&
      expected &&
      (
        field === expected ||
        field.includes(expected) ||
        expected.includes(field)
      ),
  );
}

function itemMatchesAnyTerm(
  item: SearchableItem,
  terms: string[],
): boolean {
  if (terms.length === 0) {
    return true;
  }

  const searchableFields = [
    item.title,
    item.description,
    item.category,
    item.brand,
    item.color,
    item.size,
    item.condition,
  ].map(normalize);

  return terms.some((term) =>
    searchableFields.some((field) =>
      field.includes(term),
    ),
  );
}

function isWithinPrice(
  item: SearchableItem,
  intent: AISearchIntent,
): boolean {
  const price = Number(item.price);

  if (!Number.isFinite(price)) {
    return false;
  }

  if (
    intent.min_price !== null &&
    price < intent.min_price
  ) {
    return false;
  }

  if (
    intent.max_price !== null &&
    price > intent.max_price
  ) {
    return false;
  }

  return true;
}

function calculateScore(
  item: SearchableItem,
  terms: string[],
  intent: AISearchIntent,
): number {
  const title = normalize(item.title);
  const description = normalize(
    item.description,
  );
  const brand = normalize(item.brand);
  const category = normalize(item.category);
  const color = normalize(item.color);
  const size = normalize(item.size);
  const condition = normalize(item.condition);

  let score = 0;
  let titleMatches = 0;

  for (const term of terms) {
    if (title.includes(term)) {
      score += 18;
      titleMatches += 1;
    }

    if (brand.includes(term)) {
      score += 12;
    }

    if (category.includes(term)) {
      score += 10;
    }

    if (color.includes(term)) {
      score += 9;
    }

    if (description.includes(term)) {
      score += 5;
    }

    if (condition.includes(term)) {
      score += 4;
    }

    if (size === term) {
      score += 4;
    }
  }

  if (
    terms.length > 1 &&
    titleMatches === terms.length
  ) {
    score += 25;
  }

  // These improve ranking but cannot create a
  // match without a real query-term match.
  if (fieldContains(item.brand, intent.brand)) {
    score += 16;
  }

  if (
    fieldContains(
      item.category,
      intent.category,
    )
  ) {
    score += 12;
  }

  if (fieldContains(item.color, intent.color)) {
    score += 12;
  }

  if (fieldContains(item.size, intent.size)) {
    score += 10;
  }

  if (
    fieldContains(
      item.condition,
      intent.condition,
    )
  ) {
    score += 8;
  }

  return score;
}

export function rankItemsForAiSearch<
  T extends SearchableItem,
>(
  items: T[],
  originalQuery: string,
  intent: AISearchIntent,
): T[] {
  const candidates = items.filter((item) =>
    isWithinPrice(item, intent),
  );

  const terms = getSearchTerms(
    originalQuery,
    intent,
  );

  const hasRelevanceSignals = Boolean(
    terms.length ||
      intent.category ||
      intent.brand ||
      intent.color ||
      intent.size ||
      intent.condition,
  );

  if (!hasRelevanceSignals) {
    return candidates;
  }

  return candidates
    .map((item) => ({
      item,
      score: calculateScore(
        item,
        terms,
        intent,
      ),
      hasTermMatch: itemMatchesAnyTerm(
        item,
        terms,
      ),
    }))
    .filter(
      ({ score, hasTermMatch }) =>
        score > 0 && hasTermMatch,
    )
    .sort(
      (left, right) =>
        right.score - left.score ||
        Number(right.item.id) -
          Number(left.item.id),
    )
    .map(({ item }) => item);
}