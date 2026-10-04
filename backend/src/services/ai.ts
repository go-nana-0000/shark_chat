// OpenRouter呼び出し

import { systemPrompt } from "../systemPrompt.js";
import { MODEL_NAME } from "../config.js";
import { ChatError } from "../errors.js";

type OpenRouterResponse = {
    choices?: { message?: { content?: string } }[];
};

// OpenRouterにメッセージを送り、AIの生テキストを返す
export async function callAI(apiKey: string, message: string): Promise<string> {
    console.log("[CHAT] Using model:", MODEL_NAME);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "X-OpenRouter-Title": "Shark Chat",
        },
        body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message },
            ],
        }),
    });

    //
    if (!response.ok) {
        console.error("[CHAT] OpenRouter API error:", await response.text());
        throw new ChatError("AIの呼び出しに失敗しました");
    }

    const result = (await response.json()) as OpenRouterResponse;
    const text = result.choices?.[0]?.message?.content ?? "";

    if (!text) {
        console.error("[CHAT] AI response content is empty");
        throw new ChatError("AIからの応答を取得できませんでした");
    }

    return text;
}
