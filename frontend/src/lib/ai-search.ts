import { API_URL } from "./api";

export type AISearchIntent = {
  summary: string;
  keywords: string[];
  category: string | null;
  brand: string | null;
  color: string | null;
  size: string | null;
  condition: string | null;
  min_price: number | null;
  max_price: number | null;
};

export type AISearchResponse = {
  query: string;
  intent: AISearchIntent;
  model: string;
};

export async function interpretStyleSearch(
  query: string,
): Promise<AISearchResponse> {
  const response = await fetch(`${API_URL}/ai/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: query.trim(),
    }),
  });

  let data: any = {};

  try {
    data = await response.json();
  } catch {
    // The fallback error below handles non-JSON responses.
  }

  if (!response.ok) {
    throw new Error(
      data.detail || "Reloop could not understand that search.",
    );
  }

  return data as AISearchResponse;
}