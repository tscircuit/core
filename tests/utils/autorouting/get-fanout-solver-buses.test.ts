import { expect, test } from "bun:test"
import { getFanoutSolverBuses } from "lib/utils/autorouting/FanoutAutorouter"
import { resolveBusTargetLayer } from "lib/utils/autorouting/resolve-bus-target-layer"

test("fanout and winding resolve one shared bus target layer", () => {
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

  expect(
    getFanoutSolverBuses([
      {
        busId: "DATA",
        connectionNames: ["D0"],
        preferredLayer: "inner2",
        preferredLayers: ["bottom", "inner2"],
      },
      {
        busId: "CONTROL",
        connectionNames: ["CS"],
        allowedLayers: ["top", "inner1"],
        preferredLayers: ["inner1"],
      },
      {
        busId: "UNCONSTRAINED",
        connectionNames: ["CLK"],
      },
    ]),
  ).toEqual([
    {
      busId: "DATA",
      connectionNames: ["D0"],
      allowedLayers: ["inner2"],
    },
    {
      busId: "CONTROL",
      connectionNames: ["CS"],
      allowedLayers: ["inner1"],
    },
    {
      busId: "UNCONSTRAINED",
      connectionNames: ["CLK"],
      allowedLayers: ["top"],
    },
  ])
})
