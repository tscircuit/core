import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("autorouter does not replace pcbStraightLine trace with detour (repro #5462)", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <chip name="U1" footprint="soic8" pcbX={-4} pcbY={0} />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={1}
        pcbY={1.905}
      />
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        pcbX={4}
        pcbY={4}
      />
      <trace from="U1.pin8" to="R1.pin1" pcbStraightLine />
      <trace from="U1.pin7" to="C1.pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const traces = circuit.db.pcb_trace.list()
  expect(traces).toHaveLength(2)

  // U1.pin8 -> R1.pin1 must remain a direct straight line without being replaced by autoroute
  const straightTrace = traces.find(
    (t) => t.source_trace_id === "source_trace_0",
  )
  expect(straightTrace).toBeDefined()
  expect(straightTrace!.route).toHaveLength(2)
  expect((straightTrace as any).__replaces_pcb_trace_id).toBeUndefined()
  expect(straightTrace!.route.every((p) => p.route_type === "wire")).toBe(true)

  // U1.pin7 -> C1.pin1 routes around the fixed straight line
  const routedTrace = traces.find((t) => t.source_trace_id === "source_trace_1")
  expect(routedTrace).toBeDefined()
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
