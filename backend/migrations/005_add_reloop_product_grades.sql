ALTER TABLE items
ADD COLUMN IF NOT EXISTS reloop_grade VARCHAR(1) NOT NULL DEFAULT 'U';

ALTER TABLE items
ADD COLUMN IF NOT EXISTS grade_status VARCHAR(20) NOT NULL DEFAULT 'unverified';

ALTER TABLE items
ADD COLUMN IF NOT EXISTS grade_confidence VARCHAR(10);

ALTER TABLE items
ADD COLUMN IF NOT EXISTS grade_summary VARCHAR(300);

ALTER TABLE items
ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP WITHOUT TIME ZONE;

UPDATE items AS item
SET
    reloop_grade = CASE
        WHEN passport.source_fingerprint = '' THEN 'U'
        WHEN passport.photo_coverage = 'limited' THEN 'U'
        WHEN passport.confidence = 'low' THEN 'U'
        WHEN passport.seller_condition_consistency = 'review_recommended' THEN 'U'
        WHEN passport.visual_grade = 'like_new' THEN 'A'
        WHEN passport.visual_grade = 'good' THEN 'B'
        WHEN passport.visual_grade = 'fair' THEN 'C'
        WHEN passport.visual_grade = 'worn' THEN 'D'
        ELSE 'U'
    END,
    grade_status = CASE
        WHEN passport.source_fingerprint = '' THEN 'stale'
        WHEN passport.photo_coverage = 'limited' THEN 'needs_photos'
        WHEN passport.confidence = 'low' THEN 'needs_photos'
        WHEN passport.seller_condition_consistency = 'review_recommended' THEN 'needs_photos'
        WHEN passport.visual_grade IN ('like_new', 'good', 'fair', 'worn') THEN 'graded'
        ELSE 'needs_photos'
    END,
    grade_confidence = CASE
        WHEN passport.source_fingerprint = '' THEN NULL
        ELSE passport.confidence
    END,
    grade_summary = CASE
        WHEN passport.source_fingerprint = '' THEN NULL
        ELSE passport.summary
    END,
    graded_at = CASE
        WHEN passport.source_fingerprint = '' THEN NULL
        ELSE passport.updated_at
    END
FROM condition_passports AS passport
WHERE passport.item_id = item.id;

CREATE INDEX IF NOT EXISTS ix_items_reloop_grade
ON items (reloop_grade);
