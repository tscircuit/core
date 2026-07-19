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
      schX={-1}
      schY={0}
      connections={{
        pin1: "pin.A1",
        pin2: "pin.A2",
      }}
    />
    <resistor
      name="B"
      resistance="2k"
      schX={1}
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
    <board width="28mm" height="14mm" routingDisabled>
      <chip
        name="RN1"
        footprint="soic8"
        pinLabels={resistorNetworkPinLabels}
        pcbX={-5}
        pcbY={0}
        schX={-5}
        schY={0}
        internalCircuit={createInternalResistorNetwork()}
      />
      <chip
        name="RN2"
        footprint="soic8"
        pinLabels={resistorNetworkPinLabels}
        pcbX={5}
        pcbY={0}
        schX={5}
        schY={0}
        internalCircuit={createInternalResistorNetwork()}
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
