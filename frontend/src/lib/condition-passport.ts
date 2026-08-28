import { API_URL } from "./api";

export type ConditionPassportStatus =
  | "not_generated"
  | "ready"
  | "stale";

export type VisualGrade =
  | "like_new"
  | "good"
  | "fair"
  | "worn";

export type SellerConditionConsistency =
  | "consistent"
  | "unclear"
  | "review_recommended";

export type PhotoCoverage =
  | "strong"
  | "partial"
  | "limited";

export type ConditionConfidence =
  | "low"
  | "medium"
  | "high";

export type ObservationSeverity =
  | "minor"
  | "moderate"
  | "major";

export type ConditionObservation = {
  area: string;
  finding: string;
  severity: ObservationSeverity;
  photo_numbers: number[];
};

export type ConditionPassport = {
  id: number;
  item_id: number;
  visual_grade: VisualGrade;
  seller_condition_consistency:
    SellerConditionConsistency;
  photo_coverage: PhotoCoverage;
  confidence: ConditionConfidence;
  summary: string;
  observations: ConditionObservation[];
  limitations: string[];
  suggested_photos: string[];
  photo_count: number;
  model: string;
  created_at: string;
  updated_at: string;
  is_stale: boolean;
};

export type ConditionPassportResponse = {
  status: ConditionPassportStatus;
  passport: ConditionPassport | null;
  cached?: boolean;
};

async function readResponse(
  response: Response,
): Promise<any> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function getConditionPassport(
  itemId: number,
): Promise<ConditionPassportResponse> {
  const response = await fetch(
    `${API_URL}/items/${itemId}/condition-passport`,
  );

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      data.detail ||
        "Could not load the condition passport.",
    );
  }

  return data as ConditionPassportResponse;
}

export async function generateConditionPassport(
  itemId: number,
  ownerId: number,
): Promise<ConditionPassportResponse> {
  const response = await fetch(
    `${API_URL}/items/${itemId}/condition-passport?owner_id=${ownerId}`,
    {
      method: "POST",
    },
  );

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      data.detail ||
        "Could not generate the condition passport.",
    );
  }

  return data as ConditionPassportResponse;
}