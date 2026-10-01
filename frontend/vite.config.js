import { defineConfig } from "vite";

const useLocalWorker = false;

export default defineConfig({
  base: useLocalWorker ? "/" : "/test02/",
  
  server: {
    proxy: {
      "/api": {
        target: useLocalWorker
          ? "http://localhost:8787"
          : "https://shark-chat.kelso9929.workers.dev",
        changeOrigin: true,
      },
    },
  },
});
