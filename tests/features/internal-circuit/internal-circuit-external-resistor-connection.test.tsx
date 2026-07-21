import { expect, test } from "bun:test"
import type { Port } from "lib/components/primitive-components/Port/Port"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("external resistor connects through an internal circuit chip pin", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="18mm" height="12mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint="0402"
        pcbX={-4}
        schX={-1}
        connections={{ pin1: "net.GATE_SIGNAL" }}
      />
      <chip
        name="U1"
        footprint="sot23"
        pcbX={3}
        schX={2}
        pinLabels={{
          pin1: "GATE",
          pin2: "SOURCE",
          pin3: "DRAIN",
        }}
        connections={{
          SOURCE: "net.SOURCE",
          DRAIN: "net.DRAIN",
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

  const chipPin = circuit.selectOne(".U1 > .pin1", { type: "port" }) as Port
  const internalGate = circuit.selectOne(".A > .gate", {
    type: "port",
  }) as Port
  const chipSchematicPort = circuit.db.schematic_port.get(
    chipPin.schematic_port_id!,
  )!
  const internalGateSchematicPort = circuit.db.schematic_port.get(
    internalGate.schematic_port_id!,
  )!

  expect(chipPin.schematic_port_id).not.toBe(internalGate.schematic_port_id)
  expect(chipSchematicPort.center).toEqual(internalGateSchematicPort.center)
})
