import { defineConfig, loadEnv } from "vite";
import { getBackendUrl } from "./shared/config.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useLocalWorker = env.VITE_USE_LOCAL_WORKER === "true";

  const backendUrl = getBackendUrl(useLocalWorker);

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
