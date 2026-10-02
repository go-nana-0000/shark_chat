import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useLocalWorker = env.VITE_USE_LOCAL_WORKER === "true";

  const backendUrl = useLocalWorker
    ? "http://localhost:8787"
    : "https://shark-chat.kelso9929.workers.dev";

  return {
    base: useLocalWorker ? "/" : "/test02/",

    server: {
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
