import { expect, test } from "bun:test"
import { CopperTextRoutingBoard } from "tests/fixtures/copper-text-routing-board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("copper text repro control keeps both signal nets separate without text", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<CopperTextRoutingBoard includeCopperText={false} />)
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_copper_text.list()).toHaveLength(0)
  expect(circuit.db.source_trace.list()).toHaveLength(2)
  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces).toHaveLength(2)
  expect(new Set(pcbTraces.map((trace) => trace.source_trace_id)).size).toBe(2)
  for (const trace of pcbTraces) {
    expect(trace.route.length).toBeGreaterThanOrEqual(2)
    const start = trace.route[0]!
    const end = trace.route.at(-1)!
    if (start.route_type !== "wire" || end.route_type !== "wire") {
      throw new Error("The control must retain its planar signal endpoints")
    }
    expect(start).toMatchObject({ route_type: "wire", y: -3, layer: "top" })
    expect(end).toMatchObject({ route_type: "wire", y: 3, layer: "top" })
    expect(Math.abs(start.x)).toBeCloseTo(0.4)
    expect(end.x).toBeCloseTo(start.x)
  }
  expect(
    circuit.getCircuitJson().filter((e) => e.type.includes("error")),
  ).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
