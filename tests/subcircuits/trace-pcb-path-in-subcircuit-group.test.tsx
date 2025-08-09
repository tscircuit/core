import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// ensure Trace with manual pcbPath translates inside subcircuit group

test("trace pcbPath translates inside subcircuit group", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <group name="G1" subcircuit pcbX={3}>
        <resistor
          name="R1"
          resistance="10k"
          footprint="0402"
          pcbX={-2}
          pcbY={0}
        />
        <resistor
          name="R2"
          resistance="10k"
          footprint="0402"
          pcbX={2}
          pcbY={0}
        />
        <trace
          from=".R1 > .pin2"
          to=".R2 > .pin1"
          pcbPathRelativeTo=".R1 > .pin2"
          pcbPath={[{ x: 1, y: 0 }]}
        />
      </group>
    </board>,
  )

  await circuit.renderUntilSettled()

  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces.length).toBe(1)
  const routeCoords = pcbTraces[0].route.map((p) => ({ x: p.x, y: p.y }))
  expect(routeCoords).toEqual([
    { x: 1.5, y: 0 },
    { x: 2.5, y: 0 },
    { x: 4.5, y: 0 },
  ])
  expect(circuit.db.pcb_trace_error.list().length).toBe(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
