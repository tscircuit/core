import { expect, test } from "bun:test"
import { getObstaclesFromRoute } from "lib/utils/obstacles/getObstaclesFromRoute"

test("getObstaclesFromRoute rejects a diagonal routed trace segment", () => {
  expect(() =>
    getObstaclesFromRoute(
      [
        { x: -3.0127, y: -11.3044, layer: "top" },
        { x: -2.5425446949529054, y: -11.1644, layer: "top" },
      ],
      "source_port_130_0",
    ),
  ).toThrow(
    "getObstaclesFromTrace currently only supports horizontal and vertical traces (not diagonals)",
  )
})
