import { expect, test } from "bun:test"
import type {
  ImplicitBreakoutPointSolverInput,
  ImplicitBreakoutPointSolverOutput,
} from "@tscircuit/props"
import { validateImplicitBreakoutBusOutput } from "../../lib/components/primitive-components/Breakout/validate-implicit-breakout-bus-output"

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
  connections: [],
  buses: [
    {
      busId: "byte0",
      connectionIds: ["dq0", "dq1"],
      targetLayers: ["inner2"],
    },
  ],
  boundaryPointSpacing: 0.5,
}

test("requires the same connection winding at opposing breakout sides", () => {
  const reversedOutput: ImplicitBreakoutPointSolverOutput = {
    breakoutPoints: [
      {
        regionId: "left",
        connectionId: "dq0",
        layer: "inner2",
        x: -3,
        y: -0.5,
      },
      { regionId: "left", connectionId: "dq1", layer: "inner2", x: -3, y: 0.5 },
      { regionId: "right", connectionId: "dq0", layer: "inner2", x: 3, y: 0.5 },
      {
        regionId: "right",
        connectionId: "dq1",
        layer: "inner2",
        x: 3,
        y: -0.5,
      },
    ],
  }

  expect(() =>
    validateImplicitBreakoutBusOutput(input, reversedOutput),
  ).toThrow(
    'Implicit breakout bus "byte0" reverses winding between regions "left" and "right"',
  )
})
