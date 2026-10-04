// 利用回数の取得・制限判定・更新（D1）

const RESET_TIME = 1 * 60 * 1000; // 1分
const MAX_COUNT = 3;

type UsageRow = { count: number; reset_at: number | null };

export type UsageState = {
    exists: boolean; // DBに行が存在するか
    count: number;
    resetAt: number | null;
};

// 利用状況を取得。リセット時刻を過ぎていたらここでリセットする
export async function loadUsage(
    db: D1Database,
    userId: string
): Promise<UsageState> {
    const row = await db
        .prepare("SELECT count, reset_at FROM usage WHERE user_id = ?")
        .bind(userId)
        .first<UsageRow>();

    const now = Date.now();

    if (row && row.reset_at !== null && now >= row.reset_at) {
        await db
            .prepare("UPDATE usage SET count = 0, reset_at = NULL WHERE user_id = ?")
            .bind(userId)
            .run();

        console.log("[USAGE] reset time passed. Count reset.");
        return { exists: true, count: 0, resetAt: null };
    }

    const state: UsageState = {
        exists: row !== null,
        count: row?.count ?? 0,
        resetAt: row?.reset_at ?? null,
    };

    console.log(
        "[USAGE] User:",
        userId,
        "Count:",
        state.count,
        "Reset at:",
        state.resetAt ? new Date(state.resetAt).toISOString() : "null"
    );
    return state;
}

export function isLimitReached(state: UsageState): boolean {
    return state.count >= MAX_COUNT;
}

export function logLimitReached(state: UsageState): void {
    const now = Date.now();
    const wait =
        state.resetAt && state.resetAt > now ? (state.resetAt - now) / 1000 : 0;

    console.warn("[USAGE] Reached the limit messages in 1 minute.");
    console.warn(
        "[USAGE] Now:",
        new Date(now).toISOString(),
        "Reset at:",
        state.resetAt ? new Date(state.resetAt).toISOString() : "null"
    );
    console.warn("[USAGE] Ready for use:", wait, "seconds later");
}

// 利用回数を1増やす（初回・リセット後は1から開始）
export async function recordUsage(
    db: D1Database,
    userId: string,
    state: UsageState
): Promise<void> {
    const newResetAt = Date.now() + RESET_TIME;

    if (!state.exists || state.resetAt === null) {
        await db
            .prepare(
                `INSERT INTO usage (user_id, count, reset_at)
         VALUES (?, 1, ?)
         ON CONFLICT(user_id)
         DO UPDATE SET count = 1, reset_at = excluded.reset_at`
            )
            .bind(userId, newResetAt)
            .run();

        console.log("[USAGE] Count reset/start. Reset at:", new Date(newResetAt).toISOString());
    } else {
        await db
            .prepare(
                `UPDATE usage
         SET count = count + 1, reset_at = ?
         WHERE user_id = ?`
            )
            .bind(newResetAt, userId)
            .run();

        console.log("[USAGE] Count increased. Reset at:", new Date(newResetAt).toISOString());
    }
}
