CREATE TABLE IF NOT EXISTS pricing_references (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL,
    source_listing_id VARCHAR(200) NOT NULL,
    source_url TEXT,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(80),
    brand VARCHAR(100),
    condition VARCHAR(40),
    price_pkr DOUBLE PRECISION NOT NULL,
    reference_type VARCHAR(20) NOT NULL,
    observed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by VARCHAR(120),
    verified_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_pricing_reference_source_listing
        UNIQUE (source_name, source_listing_id),
    CONSTRAINT ck_pricing_reference_price
        CHECK (price_pkr >= 100),
    CONSTRAINT ck_pricing_reference_type
        CHECK (reference_type IN ('asking', 'sold'))
);

CREATE INDEX IF NOT EXISTS ix_pricing_references_verified_observed
    ON pricing_references (is_verified, observed_at DESC);
