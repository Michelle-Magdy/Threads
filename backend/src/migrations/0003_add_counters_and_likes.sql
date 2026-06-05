CREATE TABLE IF NOT EXISTS thread_likes(
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id BIGINT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id,thread_id)
);

CREATE INDEX IF NOT EXISTS idx_thread_likes_thread_id ON thread_likes(thread_id);

CREATE OR REPLACE FUNCTION update_thread_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE threads SET likes_count = likes_count + 1 WHERE id = NEW.thread_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE threads SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.thread_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_thread_likes ON thread_likes;

CREATE TRIGGER trigger_update_thread_likes
AFTER INSERT OR DELETE ON thread_likes
FOR EACH ROW EXECUTE FUNCTION update_thread_likes_count();

CREATE TABLE IF NOT EXISTS thread_comments(
    id BIGSERIAL PRIMARY KEY,
    thread_id BIGINT NOT NULL REFERENCES threads(id) ON DELETE CASCADE ,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE thread_comments
ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT(0),
ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES thread_comments(id) ON DELETE CASCADE,
DROP COLUMN IF EXISTS avatar_url;

ALTER TABLE thread_comments ALTER COLUMN likes_count SET DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_comments_thread_created_at ON thread_comments(thread_id,created_at ASC);

CREATE INDEX IF NOT EXISTS idx_comments_parent_id 
ON thread_comments(parent_id)
WHERE parent_id IS NOT NULL;


CREATE OR REPLACE FUNCTION update_thread_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE threads SET comments_count = comments_count + 1 WHERE id = NEW.thread_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE threads SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.thread_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_thread_comments ON thread_comments;

CREATE TRIGGER trigger_update_thread_comments
AFTER INSERT OR DELETE ON thread_comments
FOR EACH ROW EXECUTE FUNCTION update_thread_comments_count();


CREATE TABLE IF NOT EXISTS comment_likes(
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_id BIGINT NOT NULL REFERENCES thread_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id,comment_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);

CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE thread_comments SET likes_count = likes_count +1 WHERE id = NEW.comment_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE thread_comments SET likes_count = GREATEST(likes_count -1,0) WHERE id = OLD.comment_id;
        
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_likes ON comment_likes;

CREATE TRIGGER trigger_update_comment_likes
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();


-- Create a global trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply it to the threads table
DROP TRIGGER IF EXISTS trigger_set_threads_updated_at ON threads;
CREATE TRIGGER trigger_set_threads_updated_at
BEFORE UPDATE ON threads
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Apply it to the thread_comments table
DROP TRIGGER IF EXISTS trigger_set_comments_updated_at ON thread_comments;
CREATE TRIGGER trigger_set_comments_updated_at
BEFORE UPDATE ON thread_comments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();