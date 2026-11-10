import { expect, test } from "bun:test"
import { runRemotePlaneRouting } from "tests/fixtures/run-remote-plane-routing"

test("remote unbroken pours reserve their outline rather than the entire layer", async () => {
  for (const serverMode of ["solve-endpoint", "job"] as const) {
    const { circuit, autorouterInput } = await runRemotePlaneRouting(
      serverMode,
      {
        // Board-world points in mm: +X right, +Y up, +Z toward the top layer
        // (right-handed). The signal corridor at y=0 is outside this plane.
        outline: [
          { x: -9, y: 2 },
          { x: 9, y: 2 },
          { x: 9, y: 5 },
          { x: -9, y: 5 },
        ],
      },
    )

    expect(circuit.db.pcb_trace.list()).toHaveLength(1)
    expect(
      circuit.db.pcb_trace
        .list()
        .some((trace) =>
          trace.route.some(
            (point) => point.route_type === "wire" && point.layer === "inner1",
          ),
        ),
    ).toBe(true)
    const planeObstacles = autorouterInput.obstacles.filter(
      (obstacle) => obstacle.isCopperPour,
    )
    expect(planeObstacles.length).toBeGreaterThan(0)
    for (const obstacle of planeObstacles) {
      expect(obstacle.center.y - obstacle.height / 2).toBeGreaterThanOrEqual(2)
      expect(obstacle.center.y + obstacle.height / 2).toBeLessThanOrEqual(5)
    }
    await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  }
})
