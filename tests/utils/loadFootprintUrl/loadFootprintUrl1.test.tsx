import { test, expect } from "bun:test"
import { loadFootprintUrl } from "lib/utils/loadFootprintUrl"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import { FakeFootprintServer } from "./FakeFootprintServer"
import { dualPadTestData } from "./testData"

test("loadFootprintUrl should use cache and avoid second network request", async () => {
  // Create a simple cache implementation
  const cache: Record<string, string> = {}
  const cacheEngine: LocalCacheEngine = {
    getItem: (key: string) => cache[key] ?? null,
    setItem: (key: string, value: string) => {
      cache[key] = value
    },
  }

  const fakeServer = new FakeFootprintServer(dualPadTestData, true)

  try {
    const testUrl = "http://localhost:3000/test-footprint.json"
    const ctx = {
      cacheEngine,
      componentName: "TestResistor",
      componentRotation: 0,
      pinLabels: { pin1: "1", pin2: "2" },
    }

    // First call should fetch from network
    const fpComponents1 = await loadFootprintUrl(testUrl, ctx)
    expect(fakeServer.getRequestCount()).toBe(1)
    expect(fpComponents1.length).toBeGreaterThan(0)

    // Second call should use cache (server should not be called again)
    const fpComponents2 = await loadFootprintUrl(testUrl, ctx)
    expect(fakeServer.getRequestCount()).toBe(1) // Still 1, not 2!
    expect(fpComponents2.length).toBe(fpComponents1.length)

    // Verify cache contains the data
    const cacheKey = `footprint:${testUrl}`
    expect(cache[cacheKey]).toBeDefined()
    const cachedData = JSON.parse(cache[cacheKey])
    expect(cachedData).toHaveLength(2)
  } finally {
    global.fetch = originalFetch
  }
})
