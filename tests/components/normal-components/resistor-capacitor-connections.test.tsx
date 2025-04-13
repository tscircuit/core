import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { sel } from "lib/sel"

test("resistor and capacitor connections prop", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        resistance="1k"
        footprint="0402"
        name="R1"
        schX={3}
        pcbX={3}
        connections={{
          pin2: ".C1 > .pos", // Connect R1 pin2 to C1 positive terminal
        }}
      />
      <capacitor
        capacitance="1000pF"
        footprint="0402"
        name="C1"
        schX={-3}
        pcbX={-3}
        connections={{
          neg: sel.R1.pin1, // Connect C1 negative terminal to R1 pin1
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Verify traces are created based on the connections prop
  const traces = circuit.db.source_trace.list()
  expect(traces.length).toBe(2) // Expect two traces to be created

  // Check specific trace connections
  const traceR1toC1 = traces.find(
    (t) => t.display_name === ".R1 > .pin2 to .C1 > .pos",
  )
  const traceC1toR1 = traces.find(
    (t) => t.display_name === ".C1 > .neg to .R1 > .pin1",
  )

  expect(traceR1toC1).toBeDefined()
  expect(traceC1toR1).toBeDefined()

  // Optional: Check schematic and PCB snapshots
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
