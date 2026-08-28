CREATE TABLE IF NOT EXISTS condition_passports (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL UNIQUE
        REFERENCES items(id) ON DELETE CASCADE,

    visual_grade VARCHAR(20) NOT NULL,
    seller_condition_consistency VARCHAR(30) NOT NULL,
    photo_coverage VARCHAR(20) NOT NULL,
    confidence VARCHAR(10) NOT NULL,

    summary TEXT NOT NULL,

    observations JSONB NOT NULL DEFAULT '[]'::jsonb,
    limitations JSONB NOT NULL DEFAULT '[]'::jsonb,
    suggested_photos JSONB NOT NULL DEFAULT '[]'::jsonb,

    photo_count INTEGER NOT NULL,
    source_fingerprint VARCHAR(64) NOT NULL,
    model VARCHAR(100) NOT NULL,

    created_at TIMESTAMP WITHOUT TIME ZONE
        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT condition_passports_photo_count_positive
        CHECK (photo_count > 0),

    CONSTRAINT condition_passports_observations_array
        CHECK (jsonb_typeof(observations) = 'array'),

    CONSTRAINT condition_passports_limitations_array
        CHECK (jsonb_typeof(limitations) = 'array'),

    CONSTRAINT condition_passports_suggested_photos_array
        CHECK (jsonb_typeof(suggested_photos) = 'array')
);