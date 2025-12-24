-- Migration created at 2025-12-24T09:28:48.536Z

CREATE TABLE publication_image (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    publication_id UUID NOT NULL REFERENCES publication(id) ON DELETE CASCADE
);

-- Migrate existing publications to have at least one image
INSERT INTO publication_image (id, publication_id)
SELECT id, id FROM publication
WHERE NOT EXISTS (
    SELECT 1 FROM publication_image WHERE publication_image.publication_id = publication.id
);
