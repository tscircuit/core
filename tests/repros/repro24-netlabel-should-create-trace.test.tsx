import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

// Ensure that netlabels create traces that the autorouter can use

test("netlabel autorouting creates pcb traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="10mm"
      height="10mm"
      autorouter={{ local: true, groupMode: "subcircuit" }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" schX={3} pcbX={3} />
      <capacitor
        name="C1"
        capacitance="1000pF"
        footprint="0402"
        schX={-3}
        pcbX={-3}
      />
      <netlabel net="VCC" connectsTo={["R1.pin1", "C1.pin1"]} />
    </board>,
  )

  await circuit.renderUntilSettled()
  console.log(circuit.db.source_trace.list())
  expect(circuit.db.source_trace.list().length).toBeGreaterThan(0)
  expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
})
