// AI応答のJSONパースと感情の検証

import { VALID_EMOTIONS, type Emotion, type ParsedAiResponse } from "../types.js";

// AIの出力(JSON想定)をパースする。JSONでなければ neutral として扱う
export function parseAiResponse(text: string): ParsedAiResponse {
    let data: { text?: string; emotion?: string };

    try {
        const cleaned = text
            .replace(/^```(?:json)?\s*/, "")
            .replace(/\s*```$/, "");
        data = JSON.parse(cleaned);
    } catch {
        console.warn("[CHAT] No JSON response from AI. Processing as neutral.");
        console.warn("[CHAT] AI response:", text);
        data = { text, emotion: "neutral" };
    }

    const emotion = VALID_EMOTIONS.includes(data.emotion as Emotion)
        ? (data.emotion as Emotion)
        : "neutral";

    return { text: data.text?.trim() ?? "", emotion };
}
