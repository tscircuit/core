import { test, expect } from "bun:test"
import { loadFootprintUrl } from "lib/utils/loadFootprintUrl"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import { FakeFootprintServer } from "./FakeFootprintServer"
import { singlePadTestData } from "./testData"

test("loadFootprintUrl should handle cache read/write errors gracefully", async () => {
  let getItemCallCount = 0
  let setItemCallCount = 0

  // Cache engine that throws errors
  const faultyCacheEngine: LocalCacheEngine = {
    getItem: (_key: string) => {
      getItemCallCount++
      throw new Error("Cache read error")
    },
    setItem: (_key: string, _value: string) => {
      setItemCallCount++
      throw new Error("Cache write error")
    },
  }

  const fakeServer = new FakeFootprintServer(singlePadTestData)
  const originalFetch = global.fetch
  global.fetch = fakeServer.handleRequest.bind(fakeServer) as typeof fetch

  try {
    const testUrl = "http://localhost:3000/test-footprint-faulty-cache.json"
    const ctx = {
      cacheEngine: faultyCacheEngine,
      componentName: "TestResistor",
      componentRotation: 0,
      pinLabels: { pin1: "1", pin2: "2" },
    }

    // Should still work despite cache errors
    const fpComponents = await loadFootprintUrl(testUrl, ctx)
    expect(fpComponents.length).toBeGreaterThan(0)
    expect(getItemCallCount).toBe(1)
    expect(setItemCallCount).toBe(1)
    expect(fakeServer.getRequestCount()).toBe(1)
  } finally {
    global.fetch = originalFetch
  }
})
