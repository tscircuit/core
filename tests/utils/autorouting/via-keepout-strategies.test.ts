import { expect, test } from "bun:test"
import { getLocalAutorouterStrategy } from "lib/utils/autorouting/local-autorouter-strategies"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"

test("every unsupported builtin strategy explicitly rejects via-only constraints", () => {
  const simpleRouteJson: SimpleRouteJson = {
    layerCount: 4,
    minTraceWidth: 0.15,
    bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
    obstacles: [],
    connections: [],
    viaKeepouts: [
      {
        shape: "rect",
        center: { x: 0, y: 0 },
        width: 4,
        height: 4,
        layers: ["top"],
      },
    ],
  }
  for (const preset of [
    "fanout",
    "single_layer_fanout",
    "dogbone",
    "bus_lanes",
  ] as const) {
    expect(() =>
      getLocalAutorouterStrategy(preset).create({
        simpleRouteJson,
        commonAutorouterOptions: {},
      }),
    ).toThrow("does not support via-only keepouts")
  }
})
