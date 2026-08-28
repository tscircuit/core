import { expect, test } from "bun:test"
import type { ImplicitBreakoutPointSolverInput } from "@tscircuit/props"
import { defaultImplicitBreakoutPointSolverFn } from "../../lib/components/primitive-components/Breakout/default-implicit-breakout-point-solver"
import { validateImplicitBreakoutBusOutput } from "../../lib/components/primitive-components/Breakout/validate-implicit-breakout-bus-output"

test("default solver emits one selected layer and winding for a whole bus", () => {
  const input: ImplicitBreakoutPointSolverInput = {
    regions: [
      {
        regionId: "left",
        bounds: { minX: -5, maxX: -3, minY: -2, maxY: 2 },
        edge: "right",
      },
      {
        regionId: "right",
        bounds: { minX: 3, maxX: 5, minY: -2, maxY: 2 },
        edge: "left",
      },
    ],
    connections: [
      {
        connectionId: "dq0",
        endpoints: [
          { regionId: "left", position: { x: -4, y: -0.75 } },
          { regionId: "right", position: { x: 4, y: -0.75 } },
        ],
      },
      {
        connectionId: "dq1",
        endpoints: [
          { regionId: "left", position: { x: -4, y: 0.75 } },
          { regionId: "right", position: { x: 4, y: 0.75 } },
        ],
      },
    ],
    buses: [
      {
        busId: "byte0",
        connectionIds: ["dq0", "dq1"],
        targetLayers: ["inner2", "inner3"],
      },
    ],
    boundaryPointSpacing: 0.5,
  }

  const output = defaultImplicitBreakoutPointSolverFn(input)
  if (output instanceof Promise) {
    throw new Error(
      "Default implicit breakout solver unexpectedly returned a promise",
    )
  }
  expect(validateImplicitBreakoutBusOutput(input, output)).toEqual([
    {
      busId: "byte0",
      selectedLayer: "inner2",
      connectionIdsInWindingOrder: ["dq0", "dq1"],
    },
  ])
})
