import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("external resistor connects to a chip port shown on its internal circuit", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="18mm" height="12mm" schMaxTraceDistance={10}>
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        connections={{ pin1: "net.GATE_SIGNAL" }}
        pcbX={-4}
        schX={-1}
      />
      <chip
        name="U1"
        footprint="sot23"
        pcbX={3}
        schX={1}
        pinLabels={{
          pin1: "GATE",
          pin2: "SOURCE",
          pin3: "DRAIN",
        }}
        schShowInternalCircuit
        internalCircuit={
          <internalcircuit>
            <mosfet
              name="A"
              channelType="n"
              mosfetMode="enhancement"
              connections={{
                gate: "U1.pin1",
                source: "U1.pin2",
                drain: "U1.pin3",
              }}
            />
          </internalcircuit>
        }
      />
      <trace from=".R1 > .pin2" to=".U1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  await expect(circuit).toMatchSchematicSnapshot(import.meta.path)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const internalCircuitPortCenters = circuit.db.schematic_port
    .list()
    .filter((port) => port.is_internal_circuit_port)
    .map((port) => `${port.center.x},${port.center.y}`)
    .sort()
  const overlappingChipPortCenters = circuit.db.schematic_port
    .list()
    .filter((port) => port.is_overlapping_internal_circuit_port)
    .map((port) => `${port.center.x},${port.center.y}`)
    .sort()

  expect(overlappingChipPortCenters).toHaveLength(3)
  expect(overlappingChipPortCenters).toEqual(internalCircuitPortCenters)
  expect(circuit.db.schematic_trace.list()).toHaveLength(1)
})
