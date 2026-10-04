// ユーザーIDの取得・作成（Cookie）

import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { AppEnv } from "../types.js";

// CookieからユーザーIDを取得。なければ新規作成してCookieにセット
export function getOrCreateUserId(c: Context<AppEnv>): string {
    const existing = getCookie(c, "user_id");
    if (existing) {
        console.log("[USER] Existing user:", existing);
        return existing;
    }

    const userId = crypto.randomUUID();
    setCookie(c, "user_id", userId, {
        httpOnly: true,
        sameSite: "lax",
        secure: false, // ローカル開発用
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
    });

    console.log("[USER] New user:", userId);
    return userId;
}
