import { test, expect } from "bun:test"
import { loadFootprintUrl } from "lib/utils/loadFootprintUrl"
import { FakeFootprintServer } from "./FakeFootprintServer"

test("loadFootprintUrl should work without cache engine", async () => {
  const fakeServer = new FakeFootprintServer()

  try {
    await fakeServer.start()

    // Use actual footprint name (SOIC8 IC package)
    const testUrl = `${fakeServer.getUrl()}/soic8`
    const ctx = {
      // No cacheEngine provided
      componentName: "TestIC",
      componentRotation: 0,
      pinLabels: {
        pin1: "VCC",
        pin2: "IN+",
        pin3: "IN-",
        pin4: "GND",
        pin5: "REF",
        pin6: "OUT",
        pin7: "V+",
        pin8: "V-",
      },
    }

    const fpComponents = await loadFootprintUrl(testUrl, ctx)
    expect(fpComponents.length).toBeGreaterThan(0)
    expect(fakeServer.getRequestCount()).toBe(1)
    // SOIC8 should have 8 pads
    expect(fpComponents.length).toBeGreaterThan(0)
  } finally {
    await fakeServer.stop()
  }
})
