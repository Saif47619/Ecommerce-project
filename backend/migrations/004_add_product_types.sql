ALTER TABLE items
ADD COLUMN IF NOT EXISTS product_type VARCHAR(50);

ALTER TABLE pricing_references
ADD COLUMN IF NOT EXISTS product_type VARCHAR(50);

CREATE INDEX IF NOT EXISTS ix_items_product_type
ON items (product_type);

CREATE INDEX IF NOT EXISTS ix_pricing_references_product_type
ON pricing_references (product_type);
