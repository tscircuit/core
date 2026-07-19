import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const createInternalCircuit = () => (
  <internalcircuit>
    <resistor
      name="A"
      resistance="1k"
      schX={-1}
      connections={{
        pin1: "pin.IN",
        pin2: "B.pin1",
      }}
    />
    <resistor
      name="B"
      resistance="2k"
      schX={1}
      connections={{
        pin2: "pin.OUT",
      }}
    />
  </internalcircuit>
)

test("internalCircuit resolves local component selectors within each package", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="28mm" height="16mm" routingDisabled>
      <chip
        name="U1"
        footprint="sot23"
        pinLabels={{ pin1: "IN", pin2: "OUT", pin3: "NC" }}
        noConnect={["NC"]}
        pcbX={-4}
        schX={-4}
        connections={{ IN: "net.IN_1", OUT: "net.OUT_1" }}
        internalCircuit={createInternalCircuit()}
      />
      <chip
        name="U2"
        footprint="sot23"
        pinLabels={{ pin1: "IN", pin2: "OUT", pin3: "NC" }}
        noConnect={["NC"]}
        pcbX={4}
        schX={4}
        connections={{ IN: "net.IN_2", OUT: "net.OUT_2" }}
        internalCircuit={createInternalCircuit()}
      />
      <schematicbox
        overlay={[
          ".U1A > port.pin1",
          ".U1A > port.pin2",
          ".U1B > port.pin1",
          ".U1B > port.pin2",
        ]}
        padding={0.5}
        strokeStyle="dashed"
        title="U1 INTERNAL CIRCUIT: U1A -> U1B"
        titleAlignment="top_center"
        titleInside={false}
        titleFontSize={0.25}
      />
      <schematicbox
        overlay={[
          ".U2A > port.pin1",
          ".U2A > port.pin2",
          ".U2B > port.pin1",
          ".U2B > port.pin2",
        ]}
        padding={0.5}
        strokeStyle="dashed"
        title="U2 INTERNAL CIRCUIT: U2A -> U2B"
        titleAlignment="top_center"
        titleInside={false}
        titleFontSize={0.25}
      />
      <pcbnotetext
        text="U1 = ONE PACKAGE"
        fontSize={0.6}
        pcbX={-6}
        pcbY={-5.5}
      />
      <pcbnotetext
        text="U2 = ONE PACKAGE"
        fontSize={0.6}
        pcbX={6}
        pcbY={-5.5}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_component.list()).toHaveLength(2)
  expect(circuit.db.pcb_missing_footprint_error.list()).toHaveLength(0)
})
