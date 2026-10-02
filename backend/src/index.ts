import { Hono } from "hono";
import { cors } from "hono/cors";
import { systemPrompt } from "./systemPrompt.js";

type Bindings = {
  OPENROUTER_API_KEY: string;
};

type ChatRequestBody = {
  message?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

const allowedOrigins = [
  "http://localhost:5173",
  "https://gojunana00.com",
];

// localhost:5173 からのアクセスを許可
app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      return allowedOrigins.includes(origin) ? origin : "";
    },
  })
);

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.post("/api/chat", async (c) => {
  console.log("POST /api/chat を受信しました");

  const body = await c.req.json<ChatRequestBody>();

  if (!body.message) {
    return c.json({ error: "メッセージをセットしてください" }, 400);
  }

  const message = body.message.trim();

  if (!message) {
    return c.json({ error: "メッセージをセットしてください" }, 400);
  }

  try {
    const apiKey = c.env.OPENROUTER_API_KEY;
    const modelName = "nvidia/nemotron-3-ultra-550b-a55b:free";
    console.log("Using model:", modelName);

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
          model: modelName,
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

    if (!response.ok) {
      const errorText = await response.text();

      console.error("OpenRouter API error:", errorText);

      return c.json(
        { error: "AIの呼び出しに失敗しました" },
        500
      );
    }

    const result = await response.json();

    const text =
      result.choices?.[0]?.message?.content ?? "";

    if (!text) {
      return c.json(
        { error: "AIからの応答を取得できませんでした" },
        500
      );
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch (error) {
      console.warn(
        "AIがJSON形式で応答しませんでした。neutralとして処理します。"
      );
      console.warn("AI response:", text);

      data = {
        text: text,
        emotion: "neutral",
      };
    }

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

    const reply = data.text?.trim();

    if (!reply) {
      return c.json(
        { error: "AIからの応答を取得できませんでした" },
        500
      );
    }

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
