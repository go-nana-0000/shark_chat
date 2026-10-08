import { defineConfig, loadEnv } from "vite";
import { getBackendUrl } from "./shared/config.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_BACKEND_TARGET;

  const backendUrl = getBackendUrl(target);
  return {
    base: target === "local" ? "/" : "/test02/",

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
