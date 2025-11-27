import "bun-match-svg"
import "./extend-expect-any-svg"
import "./simulation-matcher"
import "lib/register-catalogue"
import "./preload-debug-output-dump"
import "./preload-server-cleanup"
import { readFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toMatchInlineSnapshot(snapshot?: string | null): Promise<MatcherResult>
  }
}

// Bun's fetch currently doesn't support file:// URLs, but some WASM modules are
// loaded via `new URL("module.wasm", import.meta.url)` which resolves to file
// paths. Shim fetch to read those files directly so WASM initialization works
// during tests.
const originalFetch = globalThis.fetch

const patchedFetch: typeof fetch = (async (
  input: RequestInfo | URL,
  init?: RequestInit,
) => {
  const url = input instanceof Request ? input.url : input.toString()

  if (url.startsWith("file:")) {
    const data = await readFile(fileURLToPath(url))
    return new Response(data)
  }

  return originalFetch(input as any, init)
}) as typeof fetch

patchedFetch.preconnect = originalFetch.preconnect?.bind(originalFetch)

globalThis.fetch = patchedFetch

// Polyfill instantiateStreaming so wasm modules can fall back to array buffer
// compilation when the streaming API is missing (e.g., in Bun).
if (typeof WebAssembly.instantiateStreaming !== "function") {
  WebAssembly.instantiateStreaming = (async (
    source: Response | PromiseLike<Response>,
    importObject?: WebAssembly.Imports,
  ) => {
    const response = await source
    const bytes = await response.arrayBuffer()
    return WebAssembly.instantiate(bytes, importObject)
  }) as typeof WebAssembly.instantiateStreaming
}
