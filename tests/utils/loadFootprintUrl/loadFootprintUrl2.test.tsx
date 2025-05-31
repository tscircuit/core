import { test, expect } from "bun:test"
import { loadFootprintUrl } from "lib/utils/loadFootprintUrl"
import { FakeFootprintServer } from "./FakeFootprintServer"
import { singlePadTestData } from "./testData"

test("loadFootprintUrl should work without cache engine", async () => {
  const fakeServer = new FakeFootprintServer(singlePadTestData)
  const originalFetch = global.fetch
  global.fetch = fakeServer.handleRequest.bind(fakeServer) as typeof fetch

  try {
    const testUrl = "http://localhost:3000/test-footprint-no-cache.json"
    const ctx = {
      // No cacheEngine provided
      componentName: "TestResistor",
      componentRotation: 0,
      pinLabels: { pin1: "1", pin2: "2" },
    }

    const fpComponents = await loadFootprintUrl(testUrl, ctx)
    expect(fpComponents.length).toBeGreaterThan(0)
    expect(fakeServer.getRequestCount()).toBe(1)
  } finally {
    global.fetch = originalFetch
  }
})
