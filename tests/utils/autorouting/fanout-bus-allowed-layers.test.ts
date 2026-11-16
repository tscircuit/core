import { expect, test } from "bun:test"
import { getFanoutBusAllowedLayers } from "lib/utils/autorouting/get-fanout-bus-allowed-layers"

test("fanout preferences retain their hard carrier restriction and order", () => {
  expect(getFanoutBusAllowedLayers({})).toBeUndefined()
  expect(
    getFanoutBusAllowedLayers({ allowedLayers: ["inner1", "inner2"] }),
  ).toEqual(["inner1", "inner2"])
  expect(
    getFanoutBusAllowedLayers({
      allowedLayers: ["inner1", "inner2"],
      preferredLayer: "inner2",
    }),
  ).toEqual(["inner2"])
  expect(
    getFanoutBusAllowedLayers({
      allowedLayers: ["inner1"],
      preferredLayer: "inner2",
    }),
  ).toEqual([])
  expect(
    getFanoutBusAllowedLayers({
      preferredLayer: "inner2",
      preferredLayers: ["inner1", "inner2", "bottom"],
    }),
  ).toEqual(["inner2", "inner1", "bottom"])
  expect(
    getFanoutBusAllowedLayers({
      allowedLayers: ["bottom", "inner1"],
      preferredLayer: "inner2",
      preferredLayers: ["inner1", "bottom"],
    }),
  ).toEqual(["inner1", "bottom"])
})
