export function getBackendUrl(useLocalWorker) {
  return useLocalWorker
    ? "http://localhost:8787"
    : "https://api.gojunana00.com";
}
