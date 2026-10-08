const BACKENDS = {
  local: "http://localhost:8787",
  staging: "https://shark-chat-staging.kelso9929.workers.dev",
  production: "https://api.gojunana00.com",
};

export function getBackendUrl(target = import.meta.env.VITE_BACKEND_TARGET) {
  const url = BACKENDS[target];
  if (!url) {
    throw new Error(`VITE_BACKEND_TARGET が不正です: ${target}`);
  }
  if (import.meta.env?.PROD && target !== "production") {
    console.warn(`本番ビルドが ${target} を向いています`);
  }
  return url;
}
