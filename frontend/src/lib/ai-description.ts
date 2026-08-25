import { API_URL } from "./api";

export type ListingDescriptionDetails = {
  title: string;
  category: string;
  brand: string;
  condition: string;
  color: string;
  size: string;
};

export async function generateAiDescription(
  imageUri: string,
  details: ListingDescriptionDetails,
): Promise<string> {
  const imageResponse = await fetch(imageUri);

  if (!imageResponse.ok) {
    throw new Error("Could not read the selected photo");
  }

  const imageBlob = await imageResponse.blob();
  const uploadBlob = imageBlob.type
    ? imageBlob
    : new Blob([imageBlob], { type: "image/jpeg" });

  const formData = new FormData();
  formData.append("image", uploadBlob, "listing-photo.jpg");

  Object.entries(details).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const response = await fetch(`${API_URL}/ai/generate-description`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Could not generate a description");
  }

  if (!data.description) {
    throw new Error("Gemini returned an empty description");
  }

  return data.description;
}