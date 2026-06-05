
CREATE TABLE IF NOT EXISTS categories(
    id BIGSERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS threads(
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES categories(id),
    author_id BIGINT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE threads
ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE INDEX IF NOT EXISTS idx_thread_category_created_at
ON threads(category_id,created_at DESC);


INSERT INTO categories (slug, name, description)
VALUES
  ('general', 'General', 'Anything dev-related, off-topic but friendly.'),
  ('q-and-a', 'Q&A', 'Ask and answer coding and career questions.'),
  ('showcase', 'Showcase', 'Share what you are building or learning.'),
  ('help', 'Help', 'Stuck on something? Ask for help here.')
ON CONFLICT (slug) DO NOTHING;

