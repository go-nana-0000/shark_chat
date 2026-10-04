// 利用回数の取得・制限判定・更新（D1）

// 定数設定
const RESET_MIN = 10; // リセットまでの時間（分）
const MAX_COUNT = 10;

const RESET_TIME = RESET_MIN * 60 * 1000;

type UsageRow = { count: number; reset_at: number | null };

export type UsageState = {
    exists: boolean; // DBに行が存在するか
    count: number;
    resetAt: number | null;
};

// 利用状況を取得。リセット時刻を過ぎていたらここでリセットする
export async function loadShortUsage(
    db: D1Database,
    userId: string
): Promise<UsageState> {
    const row = await db
        .prepare("SELECT count, reset_at FROM usage WHERE user_id = ?")
        .bind(userId)
        .first<UsageRow>();

    // リセット時刻を過ぎていたらカウントを0に戻す
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

    return state;
}

// 利用回数が上限に達しているか判定
export function isLimitReached(state: UsageState): boolean {
    return state.count >= MAX_COUNT;
}

// 利用回数の情報をログに出力
export function logShortUsageInfo(state: UsageState): void {
    const now = Date.now();
    console.log("[USAGE] Now:", new Date(now).toISOString());
    console.log("[USAGE] Rst:", state.resetAt ? new Date(state.resetAt).toISOString() : "null");
}

// リセットまでの残り秒数
export function secondsUntilReset(state: UsageState): number {
    if (state.resetAt === null) return 0;
    return Math.max(0, Math.ceil((state.resetAt - Date.now()) / 1000));
}

// 利用回数の上限に達した場合のログ出力
export function logLimitReached(state: UsageState): void {
    const now = Date.now();
    const wait = state.resetAt && state.resetAt > now ? (state.resetAt - now) / 1000 : 0;
    console.warn("[USAGE] Reached the short limit. Wait: ", wait, "[sec]");
}

// 利用回数を1増やす（初回・リセット後は1から開始）
export async function recordShortUsage(
    db: D1Database,
    userId: string,
    state: UsageState
): Promise<void> {
    const newResetAt = Date.now() + RESET_TIME;

    // 初回またはリセット後は1から開始、リセット時刻を更新
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

        console.log("[USAGE] Short count reset/start.");
    } else {
        // 2回目以降の利用（reset_at は初回から固定のまま更新しない）
        await db
            .prepare(`UPDATE usage SET count = count + 1 WHERE user_id = ?`)
            .bind(userId)
            .run();

        console.log("[USAGE] Short count +1: ", state.count+1, "/", MAX_COUNT);
    }
}
