import { Hono } from "hono";
import { cors } from "hono/cors";
import { systemPrompt } from "./systemPrompt.js";
import { MODEL_NAME } from "./config.js";
import { getCookie, setCookie } from "hono/cookie";

type Bindings = {
  OPENROUTER_API_KEY: string;
  DB: D1Database;
};

type ChatRequestBody = {
  message?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// ローカル、本番環境の両方でCORSを許可する設定
const allowedOrigins = [
  "http://localhost:5173",
  "https://gojunana00.com",
];

app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      return allowedOrigins.includes(origin) ? origin : "";
    },
    credentials: true,
  })
);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/api/chat", async (c) => {
  console.log("[CHAT] request received");

  // ユーザーID取得/作成
  let userId = getCookie(c, "user_id");
  if (!userId) {
    userId = crypto.randomUUID();

    setCookie(c, "user_id", userId, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // ローカル開発用
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    console.log("[USER] New user:", userId);
  } else {
    console.log("[USER] Existing user:", userId);
  }

  // DBから利用回数取得
  const usage = await c.env.DB
    .prepare("SELECT count FROM usage WHERE user_id = ?")
    .bind(userId)
    .first<{ count: number }>();

  // 入力回数チェック
  const count = usage?.count ?? 0;
  console.log("[USAGE] User:", userId, "Count:", count);
  if (count >= 10) {
    return c.json(
      {
        error: "利用回数の上限に達しました",
      },
      429
    );
  }

  // 入力メッセージ空チェック
  const body = await c.req.json<ChatRequestBody>();
  if (!body.message) {
    return c.json({ error: "メッセージをセットしてください" }, 400);
  }
  const message = body.message.trim();
  if (!message) {
    return c.json({ error: "メッセージをセットしてください" }, 400);
  }

  try {
    // API鍵取得
    const apiKey = c.env.OPENROUTER_API_KEY;

    // AI呼び出し
    console.log("[CHAT] Using model:", MODEL_NAME);
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-OpenRouter-Title": "Shark Chat",
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: message,
            },
          ],
        }),
      }
    );

    // AI呼び出し失敗
    if (!response.ok) {
      const errorText = await response.text();

      console.error("[CHAT] OpenRouter API error:", errorText);

      return c.json(
        { error: "AIの呼び出しに失敗しました" },
        500
      );
    }

    // AI応答取得
    const result = await response.json();
    const text = result.choices?.[0]?.message?.content ?? "";
    if (!text) {
      console.error("[CHAT] AI response content is empty");
      return c.json(
        { error: "AIからの応答を取得できませんでした" },
        500
      );
    }

    // DBユーザーの利用回数更新
    await c.env.DB
      .prepare(`
        INSERT INTO usage (user_id, count)
        VALUES (?, 1)
        ON CONFLICT(user_id)
        DO UPDATE SET count = count + 1
      `)
      .bind(userId)
      .run();

    // JSONフォーマットチェック
    let data;
    try {
      const cleanedText = text
        .replace(/^```(?:json)?\s*/, "")
        .replace(/\s*```$/, "");

      data = JSON.parse(cleanedText);
    } catch (error) {
      console.warn(
        "[CHAT] No JSON response from AI. Processing as neutral."
      );
      console.warn("[CHAT] AI response:", text);

      data = {
        text: text,
        emotion: "neutral",
      };
    }

    // 表情設定
    const validEmotions = [
      "neutral",
      "happy",
      "angry",
      "sad",
      "surprised",
      "thinking",
    ];
    if (!validEmotions.includes(data.emotion)) {
      data.emotion = "neutral";
    }

    // 空白文字列をトリム
    const reply = data.text?.trim();

    // 応答が空の場合
    if (!reply) {
      return c.json(
        { error: "AIからの応答を取得できませんでした" },
        500
      );
    }

    // 応答をフロントに返す
    return c.json({
      reply,
      emotion: data.emotion,
    });
  } catch (error) {
    console.error("AI呼び出しエラー:", error);

    return c.json(
      { error: "AIの呼び出しに失敗しました" },
      500
    );
  }
});

export default app;
