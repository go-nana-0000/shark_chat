// /api/chat の処理の流れ

import { Hono } from "hono";
import type { AppEnv, ChatRequestBody } from "../types.js";
import { ChatError } from "../errors.js";
import { getOrCreateUserId } from "../services/user.js";
import {
    loadShortUsage,
    isLimitReached,
    logShortUsageInfo,
    recordShortUsage,
    logLimitReached,
    secondsUntilReset,
} from "../services/shortUsage.js";
import {
    loadDailyCount,
    isDailyLimitReached,
    recordDailyUsage,
} from "../services/dailyUsage.js";
import { callAI } from "../services/ai.js";
import { parseAiResponse } from "../services/parseAiResponse.js";

const MAX_MESSAGE_LENGTH = 200;
const chat = new Hono<AppEnv>();

chat.post("/", async (c) => {
    console.log("[CHAT] request received");

    try {
        const userId = getOrCreateUserId(c);

        // 1日の利用回数チェック
        const dailyCount = await loadDailyCount(c.env.DB, userId);
        if (isDailyLimitReached(dailyCount)) {
            throw new ChatError(
                "今日はこれまでだ。すまんが、俺も忙しいんだ。明日になったらまた話しかけてくれ。",
                429
            );
        }

        // 短時間の利用回数チェック
        const usage = await loadShortUsage(c.env.DB, userId);
        logShortUsageInfo(usage);
        const minutes = Math.max(1, Math.ceil(secondsUntilReset(usage) / 60));
        if (isLimitReached(usage)) {
            logLimitReached(usage);
            throw new ChatError("ちょっと立て込んでいる。すまんが${minutes}分後にまた来てくれ。", 429);
        }

        // 入力チェック
        const body = await c.req.json<ChatRequestBody>();
        const message = body.message?.trim();
        if (!message) {
            throw new ChatError("メッセージをセットしてくれ。", 400);
        }
        if (message.length > MAX_MESSAGE_LENGTH) {
            throw new ChatError(
                `メッセージは${MAX_MESSAGE_LENGTH}文字以内で入力してくれ。`,
                400
            );
        }

        // AI呼び出し
        const rawText = await callAI(c.env.OPENROUTER_API_KEY, message);

        // 利用回数更新
        await recordShortUsage(c.env.DB, userId, usage);
        await recordDailyUsage(c.env.DB, userId, dailyCount);

        // 応答整形
        const { text, emotion } = parseAiResponse(rawText);
        if (!text) {
            throw new ChatError("AIからの応答を取得できませんでした");
        }

        return c.json({ reply: text, emotion });
    } catch (error) {
        if (error instanceof ChatError) {
            return c.json({ error: error.message }, error.status);
        }
        console.error("[CHAT] Unexpected error:", error);
        return c.json({ error: "AIの呼び出しに失敗しました" }, 500);
    }
});

export default chat;
