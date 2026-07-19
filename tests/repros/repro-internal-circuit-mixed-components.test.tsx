import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("internalCircuit supports mixed resistor and diode components without physical duplicates", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="24mm" height="14mm" routingDisabled>
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
      <schematicbox
        width={7}
        height={4.5}
        schX={0}
        schY={-1.25}
        strokeStyle="dashed"
        title="U1 INTERNAL CIRCUIT: RESISTOR U1R + DIODE U1D"
        titleAlignment="top_center"
        titleInside={false}
        titleFontSize={0.25}
      />
      <pcbnotetext
        text="U1: ONE PHYSICAL PACKAGE FOR U1R + U1D"
        fontSize={0.6}
        pcbX={0}
        pcbY={-5}
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
