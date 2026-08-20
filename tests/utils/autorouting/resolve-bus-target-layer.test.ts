import { expect, test } from "bun:test"
import { resolveBusTargetLayer } from "lib/utils/autorouting/resolve-bus-target-layer"

test("resolves the shared fanout and winding bus target layer", () => {
  expect(
    resolveBusTargetLayer({
      preferredLayer: "inner2",
      preferredLayers: ["bottom", "inner1"],
    }),
  ).toBe("inner2")
  expect(resolveBusTargetLayer({ preferredLayers: ["inner1", "bottom"] })).toBe(
    "inner1",
  )
  expect(resolveBusTargetLayer({})).toBe("top")
})
