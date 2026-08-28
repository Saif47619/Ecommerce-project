import { API_URL } from "./api";

export type PreferredFit = "fitted" | "regular" | "relaxed";

export type FitVerdict =
  | "likely_tight"
  | "likely_fitted"
  | "likely_regular"
  | "likely_relaxed";

export type FitConfidence = "low" | "medium" | "high";

export type FitCheckRequest = {
  item_id: number;
  preferred_fit: PreferredFit;
  chest_in?: number;
  shoulder_in?: number;
  waist_in?: number;
  hip_in?: number;
  inseam_in?: number;
};

export type FitCheckResponse = {
  item_id: number;
  verdict: FitVerdict;
  label: string;
  confidence: FitConfidence;
  summary: string;
  reasons: string[];
  compared_measurements: string[];
  disclaimer: string;
  model: string;
};

export async function checkItemFit(
  request: FitCheckRequest,
): Promise<FitCheckResponse> {
  const response = await fetch(`${API_URL}/ai/fit-check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  let data: any = {};

  try {
    data = await response.json();
  } catch {
    // The fallback error below handles non-JSON responses.
  }

  if (!response.ok) {
    throw new Error(
      data.detail || "Reloop could not estimate the fit.",
    );
  }

  if (
    !data.label ||
    !data.summary ||
    !Array.isArray(data.reasons)
  ) {
    throw new Error("Reloop returned an incomplete fit estimate.");
  }

  return data as FitCheckResponse;
}