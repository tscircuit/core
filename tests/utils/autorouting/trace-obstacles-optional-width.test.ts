import { expect, test } from "bun:test"
import { getObstaclesFromRoute } from "lib/utils/obstacles/getObstaclesFromRoute"

test("missing endpoint widths do not inflate narrow wires to the legacy default", () => {
  // Board-world points in mm: +X right, +Y up, right-handed.
  for (const [startWidth, endWidth, expectedWidth] of [
    [0.05, undefined, 0.05],
    [undefined, 0.05, 0.05],
    [undefined, undefined, 0.1],
    [0.05, 0.8, 0.8],
    [0.8, 0.05, 0.8],
  ] as const) {
    const [obstacle] = getObstaclesFromRoute(
      [
        { x: 0, y: 0, layer: "top", width: startWidth },
        { x: 2, y: 0, layer: "top", width: endWidth },
      ],
      "source_trace_test",
    )
    expect(obstacle.height).toBe(expectedWidth)
    expect(obstacle.width).toBe(2 + expectedWidth)
  }
})
