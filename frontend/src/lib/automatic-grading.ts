import { API_URL } from "./api";
import type { ProductGradeFields } from "./product-grades";

export type AutomaticGradeResult = {
  attempted: boolean;
  grade: ProductGradeFields;
  message: string;
};

type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

const UNVERIFIED_GRADE: ProductGradeFields = {
  reloop_grade: "U",
  grade_label: "Unverified",
  grade_status: "needs_photos",
  grade_confidence: null,
  grade_summary: null,
  graded_at: null,
};

async function readResponse(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export function automaticGradeMessage(
  grade: ProductGradeFields,
): string {
  const normalizedGrade = (grade.reloop_grade || "U")
    .trim()
    .toUpperCase();

  if (
    grade.grade_status === "graded" &&
    ["A", "B", "C", "D"].includes(normalizedGrade)
  ) {
    const label = grade.grade_label?.trim() || "Graded";
    return `Reloop automatically assigned Grade ${normalizedGrade} — ${label}.`;
  }

  return "Reloop checked the listing and kept it Unverified until clearer, more complete photos are available.";
}

export async function automaticallyGradeItem(
  itemId: number,
  ownerId: number,
  hasPhotos: boolean,
  fetchImpl: FetchLike = fetch,
): Promise<AutomaticGradeResult> {
  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw new Error("A valid item is required for automatic grading.");
  }

  if (!Number.isInteger(ownerId) || ownerId <= 0) {
    throw new Error("A valid seller is required for automatic grading.");
  }

  if (!hasPhotos) {
    return {
      attempted: false,
      grade: { ...UNVERIFIED_GRADE },
      message: "No photos are available, so this listing is Unverified.",
    };
  }

  const response = await fetchImpl(
    `${API_URL}/items/${itemId}/condition-passport?owner_id=${ownerId}`,
    {
      method: "POST",
    },
  );

  const data = await readResponse(response);

  if (!response.ok) {
    throw new Error(
      data.detail || "Automatic grading could not finish.",
    );
  }

  const grade: ProductGradeFields = data.grade || {
    ...UNVERIFIED_GRADE,
  };

  return {
    attempted: true,
    grade,
    message: automaticGradeMessage(grade),
  };
}
