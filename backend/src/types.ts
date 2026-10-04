// 型定義（Bindings、感情の種類など）

export type Bindings = {
    OPENROUTER_API_KEY: string;
    DB: D1Database;
};

export type AppEnv = { Bindings: Bindings };

export type ChatRequestBody = {
    message?: string;
};

export const VALID_EMOTIONS = [
    "neutral",
    "happy",
    "angry",
    "sad",
    "surprised",
    "thinking",
] as const;

export type Emotion = (typeof VALID_EMOTIONS)[number];

export type ParsedAiResponse = {
    text: string;
    emotion: Emotion;
};
