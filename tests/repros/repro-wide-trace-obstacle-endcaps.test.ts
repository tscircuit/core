import { expect, test } from "bun:test"
import { createWideTraceObstacle } from "tests/fixtures/wide-trace-obstacle"

test.failing("existing trace obstacles cover the round copper end caps", () => {
  const coveredCaps: boolean[] = []
  for (const vertical of [false, true]) {
    const { obstacles } = createWideTraceObstacle(vertical)
    for (const coordinate of [-0.249, 10.249]) {
      const capPoint = vertical
        ? { x: 0, y: coordinate }
        : { x: coordinate, y: 0 }
      coveredCaps.push(
        obstacles.some(
          (obstacle) =>
            Math.abs(capPoint.x - obstacle.center.x) <= obstacle.width / 2 &&
            Math.abs(capPoint.y - obstacle.center.y) <= obstacle.height / 2,
        ),
      )
    }
  }
  expect(coveredCaps).toEqual([true, true, true, true])
})
