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

type ListingPhotoAnalysisResponse = {
  analysis?: ListingPhotoAnalysis;
  model?: string;
  detail?: string;
};

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

export function applyRecommendedCover(
  imageUris: string[],
  analysis: ListingPhotoAnalysis,
): {
  imageUris: string[];
  analysis: ListingPhotoAnalysis;
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
    },
  };
}
