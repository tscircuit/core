import { expect, test } from "bun:test"
import { createWideTraceObstacle } from "tests/fixtures/wide-trace-obstacle"

test.failing("existing trace obstacles cover the actual copper width", () => {
  const coveredEdges: boolean[] = []
  for (const vertical of [false, true]) {
    for (const width of [0.5, 1]) {
      const { obstacles } = createWideTraceObstacle(vertical, width)
      const copperEdge = vertical
        ? { x: width / 2 - 0.001, y: 5 }
        : { x: 5, y: width / 2 - 0.001 }
      coveredEdges.push(
        obstacles.some(
          (obstacle) =>
            Math.abs(copperEdge.x - obstacle.center.x) <= obstacle.width / 2 &&
            Math.abs(copperEdge.y - obstacle.center.y) <= obstacle.height / 2,
        ),
      )
    }
  }
  expect(coveredEdges).toEqual([true, true, true, true])
})
