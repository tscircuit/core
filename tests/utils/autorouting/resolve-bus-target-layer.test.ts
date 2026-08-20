import { expect, test } from "bun:test"
import { resolveBusTargetLayers } from "lib/utils/autorouting/resolve-bus-target-layer"

test("resolves shared fanout and winding bus target layers", () => {
  expect(
    resolveBusTargetLayers(
      {
        preferredLayer: "inner2",
        preferredLayers: ["bottom", "inner1"],
      },
      ["top", "bottom", "inner1", "inner2"],
    ),
  ).toEqual(["inner2"])
  expect(
    resolveBusTargetLayers({ preferredLayers: ["inner1", "bottom"] }, [
      "top",
      "bottom",
      "inner1",
      "inner2",
    ]),
  ).toEqual(["inner1", "bottom"])
  expect(
    resolveBusTargetLayers({}, ["top", "bottom", "inner1", "inner2"]),
  ).toEqual(["top", "bottom", "inner1", "inner2"])
})
