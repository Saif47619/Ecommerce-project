export const PRODUCT_TYPE_OPTIONS = [
  { value: "t_shirt", label: "T-shirt", group: "Tops" },
  { value: "polo", label: "Polo", group: "Tops" },
  { value: "shirt", label: "Shirt", group: "Tops" },
  { value: "blouse", label: "Blouse", group: "Tops" },
  { value: "kurta", label: "Kurta", group: "Pakistani wear" },
  { value: "shalwar_kameez", label: "Shalwar kameez", group: "Pakistani wear" },
  { value: "hoodie", label: "Hoodie", group: "Layers" },
  { value: "sweater", label: "Sweater", group: "Layers" },
  { value: "jacket", label: "Jacket", group: "Layers" },
  { value: "coat", label: "Coat", group: "Layers" },
  { value: "blazer", label: "Blazer", group: "Layers" },
  { value: "jeans", label: "Jeans", group: "Bottoms" },
  { value: "trousers", label: "Trousers", group: "Bottoms" },
  { value: "shorts", label: "Shorts", group: "Bottoms" },
  { value: "skirt", label: "Skirt", group: "Bottoms" },
  { value: "dress", label: "Dress", group: "One-piece" },
  { value: "activewear", label: "Activewear", group: "One-piece" },
  { value: "sneakers", label: "Sneakers", group: "Footwear" },
  { value: "formal_shoes", label: "Formal shoes", group: "Footwear" },
  { value: "sandals", label: "Sandals", group: "Footwear" },
  { value: "heels", label: "Heels", group: "Footwear" },
  { value: "boots", label: "Boots", group: "Footwear" },
  { value: "handbag", label: "Handbag", group: "Accessories" },
  { value: "backpack", label: "Backpack", group: "Accessories" },
  { value: "belt", label: "Belt", group: "Accessories" },
  { value: "cap_hat", label: "Cap / hat", group: "Accessories" },
  { value: "scarf_shawl", label: "Scarf / shawl", group: "Accessories" },
  { value: "sunglasses", label: "Sunglasses", group: "Accessories" },
  { value: "jewellery", label: "Jewellery", group: "Accessories" },
  { value: "watch", label: "Watch", group: "Accessories" },
] as const;

export type ProductType = (typeof PRODUCT_TYPE_OPTIONS)[number]["value"];

export const PRODUCT_TYPE_GROUPS = Array.from(
  new Set(PRODUCT_TYPE_OPTIONS.map((option) => option.group)),
);

export function getProductTypeLabel(value: string | null | undefined): string {
  return (
    PRODUCT_TYPE_OPTIONS.find((option) => option.value === value)?.label ||
    "Item"
  );
}
