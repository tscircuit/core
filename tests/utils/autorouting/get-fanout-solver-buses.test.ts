import { expect, test } from "bun:test"
import { getFanoutSolverBuses } from "lib/utils/autorouting/FanoutAutorouter"

test("fanout solver buses translate layer preferences into allowedLayers", () => {
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
