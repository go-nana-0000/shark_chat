import { systemPrompt } from "../systemPrompt.js";
import { MODEL_NAME } from "../config.js";
import { ChatError } from "../errors.js";

const MAX_TOKEN = 1000;
const TIMEOUT_SEC = 20;
const MAX_ATTEMPTS = 2; // 初回 + 再送1回
const RETRY_DELAY_MS = 1500;

type OpenRouterResponse = {
    choices?: { message?: { content?: string } }[];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 再送して意味があるステータスか(混雑・一時的なサーバーエラー)
function isRetryableStatus(status: number): boolean {
    return status === 429 || status >= 500;
}

// OpenRouterにメッセージを送り、AIの生テキストを返す
export async function callAI(apiKey: string, message: string): Promise<string> {
    console.log("[CHAT] Using model:", MODEL_NAME);

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const isLastAttempt = attempt === MAX_ATTEMPTS;

        let response: Response;
        try {
            response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "X-OpenRouter-Title": "Shark Chat",
                },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    session_id: "shark-chat",
                    max_tokens: MAX_TOKEN,
                    reasoning: { enabled: false },
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: message },
                    ],
                }),
                signal: AbortSignal.timeout(TIMEOUT_SEC * 1000), // ← fetchのオプション側
            });
        } catch (error) {
            // タイムアウトや通信エラー
            console.error(`[CHAT] fetch failed (attempt ${attempt}/${MAX_ATTEMPTS}):`, error);
            const isTimeout = error instanceof Error && error.name === "TimeoutError";
            // タイムアウトは待ち時間が長くなるので再送しない。通信エラーのみ再送
            if (isTimeout || isLastAttempt) {
                throw new ChatError("AIの呼び出しに失敗しました");
            }
            await sleep(RETRY_DELAY_MS);
            continue;
        }

        if (response.ok) {
            const result = (await response.json()) as OpenRouterResponse;
            const text = result.choices?.[0]?.message?.content ?? "";

            if (!text) {
                console.error("[CHAT] AI response content is empty");
                throw new ChatError("AIからの応答を取得できませんでした");
            }
            return text;
        }

        // 失敗レスポンス
        console.error(
            `[CHAT] OpenRouter API error (attempt ${attempt}/${MAX_ATTEMPTS}, status ${response.status}):`,
            await response.text(),
        );

        if (!isRetryableStatus(response.status) || isLastAttempt) {
            throw new ChatError("AIの呼び出しに失敗しました");
        }
        await sleep(RETRY_DELAY_MS);
    }

    // ループは必ずreturnかthrowで抜けるが、型のために置く
    throw new ChatError("AIの呼び出しに失敗しました");
}
