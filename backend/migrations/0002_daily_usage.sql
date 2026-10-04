-- 1日あたりの利用回数（日本時間の日付ごと）
CREATE TABLE IF NOT EXISTS daily_usage (
    user_id TEXT NOT NULL,
    day TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, day)
);
 