// 1日あたりの利用制限（日本時間の0時にリセット）
const DAILY_LIMIT = 30;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 日本時間の日付（例: "2026-10-05"）
function todayJst(): string {
    return new Date(Date.now() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

export async function loadDailyCount(
    db: D1Database,
    userId: string
): Promise<number> {
    const row = await db
        .prepare("SELECT count FROM daily_usage WHERE user_id = ? AND day = ?")
        .bind(userId, todayJst())
        .first<{ count: number }>();

    return row?.count ?? 0;
}

export function isDailyLimitReached(count: number): boolean {
    return count >= DAILY_LIMIT;
}

export async function recordDailyUsage(
    db: D1Database,
    userId: string,
    count: number
): Promise<void> {
    await db
        .prepare(
            `INSERT INTO daily_usage (user_id, day, count)
            VALUES (?, ?, 1)
            ON CONFLICT(user_id, day)
            DO UPDATE SET count = count + 1`
        )
        .bind(userId, todayJst())
        .run();

    console.log("[USAGE] Daily count +1: ", count+1, "/", DAILY_LIMIT);
}
