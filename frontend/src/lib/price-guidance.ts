import { API_URL } from "./api";


export type PricingStatus = "ready" | "insufficient_data";
export type PricingConfidence = "low" | "medium" | "high";
export type PricePosition =
  | "below_range"
  | "within_range"
  | "above_range";

export type PriceComparable = {
  item_id: number | null;
  reference_id: number | null;
  source_name: string;
  source_url: string | null;
  title: string;
  price: number;
  adjusted_price: number;
  is_sold: boolean;
};

export type PriceGuidance = {
  status: PricingStatus;
  currency: "PKR";
  confidence: PricingConfidence;
  product_type: string | null;
  suggested_min: number | null;
  suggested_midpoint: number | null;
  suggested_max: number | null;
  seller_price_position: PricePosition | null;
  sample_count: number;
  sold_sample_count: number;
  comparable_item_ids: number[];
  comparable_reference_ids: number[];
  source_names: string[];
  comparables: PriceComparable[];
  summary: string;
  warnings: string[];
  method: "reloop_comparables_v1";
};

export type PriceGuidanceDetails = {
  title: string;
  category?: string;
  productType?: string;
  brand?: string;
  condition?: string;
  sellerPrice?: string | number | null;
  excludeItemId?: number;
};

export function parseOptionalSellerPrice(
  value: string | number | null | undefined,
): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function getPricePosition(
  value: string | number | null | undefined,
  minimum: number | null,
  maximum: number | null,
): PricePosition | null {
  const price = parseOptionalSellerPrice(value);

  if (price === undefined || minimum === null || maximum === null) {
    return null;
  }

  if (price < minimum) return "below_range";
  if (price > maximum) return "above_range";
  return "within_range";
}

export function buildPriceGuidanceRequest(
  details: PriceGuidanceDetails,
) {
  const title = details.title.trim();

  if (title.length < 2) {
    throw new Error("Add a clear item title before checking the price.");
  }

  const body: {
    title: string;
    category: string;
    product_type: string;
    brand: string;
    condition: string;
    seller_price?: number;
    exclude_item_id?: number;
  } = {
    title,
    category: details.category?.trim() || "",
    product_type: details.productType?.trim() || "",
    brand: details.brand?.trim() || "",
    condition: details.condition?.trim() || "",
  };

  const sellerPrice = parseOptionalSellerPrice(details.sellerPrice);
  if (sellerPrice !== undefined) {
    body.seller_price = sellerPrice;
  }

  if (
    Number.isInteger(details.excludeItemId) &&
    Number(details.excludeItemId) > 0
  ) {
    body.exclude_item_id = Number(details.excludeItemId);
  }

  return body;
}

export async function requestPriceGuidance(
  details: PriceGuidanceDetails,
): Promise<PriceGuidance> {
  const response = await fetch(`${API_URL}/ai/price-guidance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildPriceGuidanceRequest(details)),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Fair price guidance is unavailable right now.",
    );
  }

  if (data?.status !== "ready" && data?.status !== "insufficient_data") {
    throw new Error("The price guidance response was not valid.");
  }

  return data as PriceGuidance;
}
