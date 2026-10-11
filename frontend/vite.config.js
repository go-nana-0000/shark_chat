import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_BACKEND_TARGET;

  return {
    base: target === "local" ? "/" : "/test02/",
  };
});
