import { expect, test } from "bun:test"
import { createBusLanesAutorouterConfig } from "../../../index"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("connectivity requires one shared carrier and preserves the source routing problem", async () => {
  const input: SimpleRouteJson = {
    layerCount: 4,
    minTraceWidth: 0.1,
    bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
    obstacles: [],
    connections: [],
  }
  const config = createBusLanesAutorouterConfig({ goal: "connectivity" })
  for (const buses of [
    undefined,
    [{ busId: "DATA", connectionNames: [], allowedLayers: ["top"] }],
    [
      {
        busId: "DATA",
        connectionNames: [],
        allowedLayers: ["inner1", "inner2"],
      },
    ],
    [
      { busId: "DATA", connectionNames: [], allowedLayers: ["inner1"] },
      { busId: "ADDR", connectionNames: [], allowedLayers: ["inner2"] },
    ],
  ]) {
    const problem = { ...input, buses }
    const before = structuredClone(problem)
    await expect(config.algorithmFn!(problem)).rejects.toThrow(
      "one shared non-top carrier",
    )
    expect(problem).toEqual(before)
  }
})
