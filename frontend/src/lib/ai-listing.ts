import { API_URL } from "./api";

export type ListingPhotoQuality = "strong" | "usable" | "poor";
export type ListingPhotoView =
  | "front"
  | "back"
  | "side"
  | "detail"
  | "label"
  | "defect"
  | "unknown";
export type ListingItemVisibility = "clear" | "partial" | "unclear";
export type ListingPhotoCoverage = "strong" | "partial" | "limited";
export type ListingReviewStatus =
  | "ready"
  | "needs_changes"
  | "manual_review";
export type SameItemConsistency =
  | "consistent"
  | "unclear"
  | "mismatch";
export type ListingDetailStatus =
  | "supported"
  | "mismatch"
  | "not_verifiable";
export type ListingDetailField =
  | "title"
  | "category"
  | "brand"
  | "color"
  | "condition"
  | "size";

export type ListingPhotoReview = {
  photo_number: number;
  quality: ListingPhotoQuality;
  view: ListingPhotoView;
  item_visibility: ListingItemVisibility;
  issues: string[];
  cover_score: number;
  feedback: string;
};

export type ListingPhotoAnalysis = {
  recommended_cover_photo_number: number | null;
  photo_coverage: ListingPhotoCoverage;
  summary: string;
  photos: ListingPhotoReview[];
  missing_photos: string[];
};

export type ListingDraftDetails = {
  title: string;
  category: string;
  brand: string;
  color: string;
  condition: string;
  size: string;
};

export type ListingDetailReview = {
  field: ListingDetailField;
  status: ListingDetailStatus;
  visible_value: string | null;
  reason: string;
  seller_value: string;
};

export type ListingDraftAnalysis = ListingPhotoAnalysis & {
  same_item_consistency: SameItemConsistency;
  same_item_reason: string;
  detail_checks: ListingDetailReview[];
  review_status: ListingReviewStatus;
  required_changes: string[];
  manual_review_reasons: string[];
};

type ListingPhotoAnalysisResponse = {
  analysis?: ListingPhotoAnalysis;
  model?: string;
  detail?: string;
};

type ListingDraftAnalysisResponse = {
  analysis?: ListingDraftAnalysis;
  model?: string;
  detail?: string;
};

async function appendListingPhotos(
  formData: FormData,
  imageUris: string[],
) {
  for (let index = 0; index < imageUris.length; index += 1) {
    const imageResponse = await fetch(imageUris[index]);

    if (!imageResponse.ok) {
      throw new Error(`Could not read photo ${index + 1}`);
    }

    const imageBlob = await imageResponse.blob();
    const uploadBlob = imageBlob.type
      ? imageBlob
      : new Blob([imageBlob], { type: "image/jpeg" });

    formData.append(
      "files",
      uploadBlob,
      `listing-photo-${index + 1}.jpg`,
    );
  }
}

export async function analyzeListingPhotos(
  imageUris: string[],
): Promise<ListingPhotoAnalysis> {
  if (imageUris.length === 0) {
    throw new Error("Add at least one photo before running the AI check");
  }

  if (imageUris.length > 5) {
    throw new Error("A maximum of five photos can be checked");
  }

  const formData = new FormData();
  await appendListingPhotos(formData, imageUris);

  const response = await fetch(`${API_URL}/ai/analyze-listing-photos`, {
    method: "POST",
    body: formData,
  });
  const data: ListingPhotoAnalysisResponse = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Could not review the listing photos");
  }

  if (!data.analysis || !Array.isArray(data.analysis.photos)) {
    throw new Error("Reloop AI returned an incomplete photo review");
  }

  return data.analysis;
}

export async function reviewListingDraft(
  imageUris: string[],
  details: ListingDraftDetails,
): Promise<ListingDraftAnalysis> {
  if (imageUris.length === 0) {
    throw new Error("Add at least one photo before reviewing the listing");
  }

  if (imageUris.length > 5) {
    throw new Error("A maximum of five photos can be reviewed");
  }

  if (details.title.trim().length < 2) {
    throw new Error("Add a clear item title before reviewing the listing");
  }

  const formData = new FormData();
  await appendListingPhotos(formData, imageUris);

  for (const [field, value] of Object.entries(details)) {
    formData.append(field, value.trim());
  }

  const response = await fetch(`${API_URL}/ai/review-listing`, {
    method: "POST",
    body: formData,
  });
  const data: ListingDraftAnalysisResponse = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Could not review the listing");
  }

  if (
    !data.analysis ||
    !Array.isArray(data.analysis.photos) ||
    !Array.isArray(data.analysis.detail_checks) ||
    !data.analysis.review_status
  ) {
    throw new Error("Reloop AI returned an incomplete listing review");
  }

  return data.analysis;
}

export async function reviewSavedListingDraft(
  itemId: number,
  details: ListingDraftDetails,
): Promise<ListingDraftAnalysis> {
  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw new Error("This listing could not be identified");
  }

  if (details.title.trim().length < 2) {
    throw new Error("Add a clear item title before reviewing the listing");
  }

  const formData = new FormData();

  for (const [field, value] of Object.entries(details)) {
    formData.append(field, value.trim());
  }

  const response = await fetch(
    `${API_URL}/ai/items/${itemId}/review-listing`,
    {
      method: "POST",
      body: formData,
    },
  );
  const data: ListingDraftAnalysisResponse = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Could not review the listing");
  }

  if (
    !data.analysis ||
    !Array.isArray(data.analysis.photos) ||
    !Array.isArray(data.analysis.detail_checks) ||
    !data.analysis.review_status
  ) {
    throw new Error("Reloop AI returned an incomplete listing review");
  }

  return data.analysis;
}

export function applyRecommendedCover<T extends ListingPhotoAnalysis>(
  imageUris: string[],
  analysis: T,
): {
  imageUris: string[];
  analysis: T;
} {
  const recommendedNumber = analysis.recommended_cover_photo_number;

  if (recommendedNumber === null || recommendedNumber === 1) {
    return { imageUris, analysis };
  }

  const selectedIndex = recommendedNumber - 1;

  if (selectedIndex < 0 || selectedIndex >= imageUris.length) {
    throw new Error("The recommended cover no longer matches these photos");
  }

  const reorderedUris = [...imageUris];
  const [recommendedUri] = reorderedUris.splice(selectedIndex, 1);
  reorderedUris.unshift(recommendedUri);

  const remapPhotoNumber = (oldNumber: number) => {
    if (oldNumber === recommendedNumber) return 1;
    if (oldNumber < recommendedNumber) return oldNumber + 1;
    return oldNumber;
  };

  const reorderedReviews = analysis.photos
    .map((photo) => ({
      ...photo,
      photo_number: remapPhotoNumber(photo.photo_number),
    }))
    .sort((first, second) => first.photo_number - second.photo_number);

  return {
    imageUris: reorderedUris,
    analysis: {
      ...analysis,
      recommended_cover_photo_number: 1,
      photos: reorderedReviews,
    } as T,
  };
}
