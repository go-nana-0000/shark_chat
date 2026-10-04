// アプリ本体

import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./types.js";
import chat from "./routes/chat.js";

const app = new Hono<AppEnv>();

// ローカル、本番環境の両方でCORSを許可する設定
const allowedOrigins = [
  "http://localhost:5173",
  "https://gojunana00.com"
];

app.use(
  "/api/*",
  cors({
    origin: (origin) => (allowedOrigins.includes(origin) ? origin : ""),
    credentials: true,
  })
);

app.get("/", (c) => c.text("Hello Hono!"));
app.route("/api/chat", chat);

export default app;
