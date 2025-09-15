import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<pushbutton /> with connections prop", async () => {
  const { circuit } = getTestFixture()

  // Create a circuit with a pushbutton and a resistor, connecting them via the connections prop
  circuit.add(
    <board width="30mm" height="20mm" routingDisabled>
      <pushbutton
        name="SW1"
        footprint="pushbutton"
        pcbX={0}
        pcbY={0}
        connections={{
          // Connect pin1 to resistor's pin1
          pin1: ".R1 .pin1",
          // Connect pin2 to resistor's pin2
          pin2: ".R1 .pin2",
        }}
      />
      <resistor name="R1" resistance="1k" pcbX={10} pcbY={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Get all traces and verify connections were created
  const traces = circuit.db.source_trace.list()

  // Should have 2 traces (pin1->R1.pin1 and pin2->R1.pin2)
  expect(traces.length).toBe(2)
})
