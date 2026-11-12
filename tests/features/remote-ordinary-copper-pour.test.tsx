import { expect, test } from "bun:test"
import { runRemotePlaneRouting } from "tests/fixtures/run-remote-plane-routing"

test("ordinary remote copper pours leave inner1 available for signal wires", async () => {
  for (const serverMode of ["solve-endpoint", "job"] as const) {
    const { circuit, autorouterInput } = await runRemotePlaneRouting(
      serverMode,
      false,
    )

    expect(circuit.db.pcb_trace.list()).toHaveLength(1)
    expect(
      circuit.db.pcb_trace
        .list()[0]!
        .route.some(
          (point) => point.route_type === "wire" && point.layer === "inner1",
        ),
    ).toBe(true)
    expect(
      autorouterInput.obstacles.some((obstacle) => obstacle.isCopperPour),
    ).toBe(false)
    expect(circuit.db.pcb_copper_pour.list().length).toBeGreaterThan(0)
  }
})
