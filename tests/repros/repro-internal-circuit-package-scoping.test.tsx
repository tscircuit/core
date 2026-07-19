import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const resistorNetworkPinLabels = {
  pin1: "A1",
  pin2: "A2",
  pin3: "B1",
  pin4: "B2",
} as const

const createInternalResistorNetwork = () => (
  <internalcircuit>
    <resistor
      name="A"
      resistance="1k"
      schX={-2}
      schY={0}
      connections={{
        pin1: "pin.A1",
        pin2: "pin.A2",
      }}
    />
    <resistor
      name="B"
      resistance="2k"
      schX={2}
      schY={0}
      connections={{
        pin1: "pin.B1",
        pin2: "pin.B2",
      }}
    />
  </internalcircuit>
)

test("internalCircuit scopes repeated child names to each physical package", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="32mm" height="16mm" routingDisabled>
      <chip
        name="RN1"
        footprint="soic8"
        pinLabels={resistorNetworkPinLabels}
        connections={{
          A1: "net.RN1_A1",
          A2: "net.RN1_A2",
          B1: "net.RN1_B1",
          B2: "net.RN1_B2",
        }}
        pcbX={-6}
        pcbY={0}
        schX={-7}
        schY={0}
        internalCircuit={createInternalResistorNetwork()}
      />
      <chip
        name="RN2"
        footprint="soic8"
        pinLabels={resistorNetworkPinLabels}
        connections={{
          A1: "net.RN2_A1",
          A2: "net.RN2_A2",
          B1: "net.RN2_B1",
          B2: "net.RN2_B2",
        }}
        pcbX={6}
        pcbY={0}
        schX={7}
        schY={0}
        internalCircuit={createInternalResistorNetwork()}
      />
      <schematicbox
        overlay={[
          ".RN1A > port.pin1",
          ".RN1A > port.pin2",
          ".RN1B > port.pin1",
          ".RN1B > port.pin2",
        ]}
        padding={0.5}
        strokeStyle="dashed"
        title="RN1 INTERNAL CIRCUIT: RN1A + RN1B"
        titleAlignment="top_center"
        titleInside={false}
        titleFontSize={0.25}
      />
      <schematicbox
        overlay={[
          ".RN2A > port.pin1",
          ".RN2A > port.pin2",
          ".RN2B > port.pin1",
          ".RN2B > port.pin2",
        ]}
        padding={0.5}
        strokeStyle="dashed"
        title="RN2 INTERNAL CIRCUIT: RN2A + RN2B"
        titleAlignment="top_center"
        titleInside={false}
        titleFontSize={0.25}
      />
      <pcbnotetext
        text="RN1 = ONE PACKAGE"
        fontSize={0.6}
        pcbX={-6}
        pcbY={-5.5}
      />
      <pcbnotetext
        text="RN2 = ONE PACKAGE"
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
