// /api/chat の処理の流れ

import { Hono } from "hono";
import type { AppEnv, ChatRequestBody } from "../types.js";
import { ChatError } from "../errors.js";
import { getOrCreateUserId } from "../services/user.js";
import {
    loadUsage,
    isLimitReached,
    logUsageInfo,
    recordUsage,
    logLimitReached
} from "../services/usage.js";
import { callAI } from "../services/ai.js";
import { parseAiResponse } from "../services/parseAiResponse.js";

const chat = new Hono<AppEnv>();

chat.post("/", async (c) => {
    console.log("[CHAT] request received");

    try {
        const userId = getOrCreateUserId(c);

        // 利用回数チェック
        const usage = await loadUsage(c.env.DB, userId);
        logUsageInfo(usage);

        if (isLimitReached(usage)) {
            logLimitReached(usage);
            throw new ChatError("利用回数の上限に達しました", 429);
        }

        // 入力チェック
        const body = await c.req.json<ChatRequestBody>();
        const message = body.message?.trim();
        if (!message) {
            throw new ChatError("メッセージをセットしてください", 400);
        }

        // AI呼び出し
        const rawText = await callAI(c.env.OPENROUTER_API_KEY, message);

        // 利用回数更新
        await recordUsage(c.env.DB, userId, usage);

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
        console.error("想定外エラー:", error);
        return c.json({ error: "AIの呼び出しに失敗しました" }, 500);
    }
});

export default chat;
