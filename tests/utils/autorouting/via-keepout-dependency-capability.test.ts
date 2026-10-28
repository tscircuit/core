import { expect, test } from "bun:test"
import { AutoroutingPipelineSolver9_PreloadedTraceGraph } from "@tscircuit/capacity-autorouter"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"

test("an older installed autorouter is rejected before it can ignore via constraints", () => {
  const solver = AutoroutingPipelineSolver9_PreloadedTraceGraph
  const descriptor = Object.getOwnPropertyDescriptor(
    solver,
    "supportsViaKeepouts",
  )
  try {
    Object.defineProperty(solver, "supportsViaKeepouts", {
      value: undefined,
      configurable: true,
    })
    expect(
      () =>
        new TscircuitAutorouter({
          layerCount: 2,
          minTraceWidth: 0.15,
          bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
          obstacles: [],
          connections: [],
          viaKeepouts: [
            {
              shape: "circle",
              center: { x: 0, y: 0 },
              radius: 1,
              layers: ["top"],
            },
          ],
        }),
    ).toThrow("Installed autorouter does not support")
    expect(
      () =>
        new TscircuitAutorouter({
          layerCount: 2,
          minTraceWidth: 0.15,
          bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
          obstacles: [],
          connections: [],
        }),
    ).not.toThrow()
  } finally {
    if (descriptor)
      Object.defineProperty(solver, "supportsViaKeepouts", descriptor)
    else Reflect.deleteProperty(solver, "supportsViaKeepouts")
  }
})
