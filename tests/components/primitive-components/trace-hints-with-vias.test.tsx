import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace hints with vias", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" autorouter="sequential-trace">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-5}
        pcbY={0}
      />
      <resistor name="R2" resistance="10k" footprint="0402" pcbX={5} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <tracehint for=".R1 .pin2" offset={{ x: -3, y: 5 }} />
    </board>,
  )

  circuit.render()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces.length).toBeGreaterThan(0)

  expect(
    pcbTraces[0].route.some(
      (p) => p.route_type === "wire" && p.start_pcb_port_id,
    ),
  ).toBe(true)
  expect(
    pcbTraces[0].route.some(
      (p) => p.route_type === "wire" && p.end_pcb_port_id,
    ),
  ).toBe(true)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
