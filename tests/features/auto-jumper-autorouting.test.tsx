import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("board with auto_jumper autorouter for single layer with crossing traces", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm" layers={1} autorouter="auto_jumper">
      <chip
        footprint="dip16_w14"
        name="U1"
        connections={{
          pin1: "U1.pin9",
          pin2: "U1.pin10",
          pin3: "U1.pin11",
          pin4: "U1.pin12",
          pin5: "U1.pin13",
          pin6: "U1.pin14",
          pin7: "U1.pin15",
          pin8: "U1.pin16",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  // Verify that we have PCB traces in the output
  const traces = circuit.selectAll("trace")
  expect(traces.length).toBeGreaterThan(0)

  // Match against a PCB snapshot to verify routing with jumpers
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
