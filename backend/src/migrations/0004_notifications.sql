CREATE TABLE IF NOT EXISTS notifications(
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN('REPLY_ON_THREAD','LIKE_ON_THREAD','LIKE_ON_COMMENT','REPLY_ON_COMMENT')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ ,
    thread_id BIGINT REFERENCES threads(id) ON DELETE CASCADE
     
);


CREATE INDEX IF NOT EXISTS idx_notifications_thread_id ON notifications(thread_id);

CREATE INDEX IF NOT EXISTS idx_notifications_unread_user 
ON notifications(user_id) 
WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);