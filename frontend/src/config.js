import { getBackendUrl } from "../shared/config.js";

const useLocalWorker =
  import.meta.env.VITE_USE_LOCAL_WORKER === "true";

export const backendUrl = getBackendUrl(useLocalWorker);
