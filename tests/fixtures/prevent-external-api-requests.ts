const blockedHosts = new Set([
  "registry-api.tscircuit.com",
  "api.tscircuit.com",
  "jlcsearch.tscircuit.com",
]);

export const preventExternalApiRequests = () => {
  if ((globalThis.fetch as any).__tscircuit_blocking_wrapped) return;

  const originalFetch = globalThis.fetch;
  const wrappedFetch = Object.assign(
    async (input: any, init?: any) => {
      const urlString =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      const hostname = (() => {
        try {
          return new URL(urlString).hostname;
        } catch {
          return "";
        }
      })();
      if (blockedHosts.has(hostname)) {
        throw new Error(
          `Network access to ${hostname} is not allowed during tests`,
        );
      }
      return originalFetch(input, init);
    },
    { preconnect: (originalFetch as any).preconnect },
  ) as typeof fetch;
  (wrappedFetch as any).__tscircuit_blocking_wrapped = true;
  globalThis.fetch = wrappedFetch;
};
