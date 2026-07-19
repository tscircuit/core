import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("internalCircuit supports mixed resistor and diode components without physical duplicates", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="16mm" height="12mm" routingDisabled>
      <chip
        name="U1"
        footprint="sot23"
        pinLabels={{
          pin1: "IN",
          pin2: "GND",
          pin3: "OUT",
        }}
        connections={{
          IN: "net.INPUT",
          GND: "net.GND",
          OUT: "net.OUTPUT",
        }}
        internalCircuit={
          <internalcircuit>
            <resistor
              name="R"
              resistance="10k"
              schX={-2}
              schY={0}
              connections={{
                pin1: "pin.IN",
                pin2: "pin.OUT",
              }}
            />
            <diode
              name="D"
              variant="zener"
              schX={2}
              schY={0}
              connections={{
                anode: "pin.GND",
                cathode: "pin.OUT",
              }}
            />
          </internalcircuit>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_component.list()).toHaveLength(1)
  expect(circuit.db.pcb_missing_footprint_error.list()).toHaveLength(0)
})
