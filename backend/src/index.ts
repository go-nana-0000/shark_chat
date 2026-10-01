import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { systemPrompt } from "./systemPrompt.js";

type ChatRequestBody = {
  message?: string;
};

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

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
    const apiKey = process.env.OPENROUTER_API_KEY;
    const openrouter = createOpenRouter({
      apiKey,
      appName: "Shark Chat",
      appUrl: "http://localhost:5173",
    });

    console.log("API KEY:", process.env.OPENROUTER_API_KEY ? "設定済み" : "未設定");
    const result = await generateText({
      // model: openrouter("deepseek/deepseek-v4.1-flash"),
      // model: openrouter("moonshotai/kimi-k2.6"),
      model: openrouter("nvidia/nemotron-3-ultra-550b-a55b:free"),
      system: systemPrompt,
      prompt: message,
    });

    console.log(result.response?.modelId);
    const { text } = result;

    let data;

    try {
      data = JSON.parse(text);
    } catch (error) {
      console.warn("AIがJSON形式で応答しませんでした。neutralとして処理します。");
      console.warn("AI response:", text);

      data = {
        text: text,
        emotion: "neutral",
      };
    }
      
    // const data = JSON.parse(result.text);
    console.log("emotion:", data.emotion);
    
    const reply = data.text.trim();
    if (!reply) return c.json({error: "AIからの応答を取得できませんでした"}, 500);

    return c.json({
      reply,
      emotion: data.emotion,
    });
  } catch(error) {
    console.error("AI呼び出しエラー:", error);
    return c.json({ error: "AIの呼び出しに失敗しました" }, 500);
  }
});

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
