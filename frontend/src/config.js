const useLocalWorker = import.meta.env.VITE_USE_LOCAL_WORKER === "true";

export const backendUrl = useLocalWorker
  ? "http://localhost:8787"
  : "https://shark-chat.kelso9929.workers.dev";
