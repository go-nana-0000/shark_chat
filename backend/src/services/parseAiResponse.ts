// AI応答のJSONパースと感情の検証

import { VALID_EMOTIONS, type Emotion, type ParsedAiResponse } from "../types.js";

// 例: <emotion>happy</emotion>こんにちは！
// 閉じタグが抜けていても拾えるように、</emotion> は省略可能にしている
const EMOTION_TAG = /<emotion>\s*(\w+)\s*(?:<\/emotion>)?/i;
const EMOTION_TAG_ALL = new RegExp(EMOTION_TAG.source, "gi");

function normalizeEmotion(value: string | undefined): Emotion {
    const v = value?.toLowerCase();
    return VALID_EMOTIONS.includes(v as Emotion) ? (v as Emotion) : "neutral";
}

// AIの出力から感情タグを取り出し、残りを本文として返す
export function parseAiResponse(text: string): ParsedAiResponse {
    const match = text.match(EMOTION_TAG);

    if (!match) {
        console.warn("[CHAT] No emotion tag in AI response. Processing as neutral.");
        console.warn("[CHAT] AI response:", text);
    }

    return {
        text: text.replace(EMOTION_TAG_ALL, "").trim(),
        emotion: normalizeEmotion(match?.[1]),
    };
}
