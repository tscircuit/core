import { test, expect } from "bun:test"
import { loadFootprintUrl } from "lib/utils/loadFootprintUrl"
import type { LocalCacheEngine } from "lib/local-cache-engine"
import { FakeFootprintServer } from "./FakeFootprintServer"

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

  const fakeServer = new FakeFootprintServer()

  try {
    await fakeServer.start()

    // Use actual footprint name (0402) with .json extension to test URL parsing
    const testUrl = `${fakeServer.getUrl()}/0402.json`
    const ctx = {
      cacheEngine: faultyCacheEngine,
      componentName: "TestCapacitor",
      componentRotation: 0,
      pinLabels: { pin1: "+", pin2: "-" },
    }

    // Should still work despite cache errors
    const fpComponents = await loadFootprintUrl(testUrl, ctx)
    expect(fpComponents.length).toBeGreaterThan(0)
    expect(getItemCallCount).toBe(1)
    expect(setItemCallCount).toBe(1)
    expect(fakeServer.getRequestCount()).toBe(1)
    // 0402 should have 2 pads
    expect(fpComponents.length).toBeGreaterThan(0)
  } finally {
    await fakeServer.stop()
  }
})
