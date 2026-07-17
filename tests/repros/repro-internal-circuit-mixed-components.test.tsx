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

  expect({
    sourceComponentNames: circuit.db.source_component
      .list()
      .map((component) => component.name ?? "")
      .sort(),
    sourceComponentTypes: circuit.db.source_component
      .list()
      .map((component) => component.ftype)
      .sort(),
    schematicComponentCount: circuit.db.schematic_component.list().length,
    pcbComponentCount: circuit.db.pcb_component.list().length,
    sourceTraceCount: circuit.db.source_trace.list().length,
    missingFootprintErrorCount:
      circuit.db.pcb_missing_footprint_error.list().length,
  }).toEqual({
    sourceComponentNames: ["U1", "U1D", "U1R"],
    sourceComponentTypes: ["simple_chip", "simple_diode", "simple_resistor"],
    schematicComponentCount: 2,
    pcbComponentCount: 1,
    sourceTraceCount: 7,
    missingFootprintErrorCount: 0,
  })
})
