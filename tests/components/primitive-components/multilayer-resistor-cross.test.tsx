import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("four 0402 resistors with crossing traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" footprint="0402" resistance="10k" pcbX={-3} />
      <resistor name="R2" footprint="0402" resistance="10k" pcbX={3} />
      <resistor name="R3" footprint="0402" resistance="10k" pcbY={3} />
      <resistor
        name="R4"
        footprint="0402"
        resistance="10k"
        pcbY={-3}
        layer="bottom"
      />

      <trace from=".R1 pin.1" to=".R2 pin.2" />
      <trace from=".R3 pin.1" to=".R4 pin.2" />
    </board>,
  )

  circuit.render()

  // Check if vias were created
  const vias = circuit.db.pcb_via.list()
  expect(vias.length).toBeGreaterThan(0)

  // Check if traces were created
  const traces = circuit.db.pcb_trace.list()
  expect(traces.length).toBe(2)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
