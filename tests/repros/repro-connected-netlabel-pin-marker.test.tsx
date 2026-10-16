import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pins connected only through net labels do not appear unconnected", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width={16} height={10} routingDisabled>
      <schematictext
        text="GND and SIGNAL connected; OPEN and NC unconnected"
        schX={0}
        schY={2}
        fontSize={0.2}
      />
      <chip
        name="U1"
        footprint="soic4"
        schX={0}
        schY={0}
        pinLabels={{ pin1: "GND", pin2: "SIGNAL", pin3: "OPEN", pin4: "NC" }}
        connections={{ GND: "net.GND", SIGNAL: "net.SIGNAL" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace.list()).toHaveLength(2)
  const connectedPorts = circuit.db.schematic_port
    .list()
    .filter((port) => port.is_connected)
  expect(connectedPorts.map((port) => port.pin_number).sort()).toEqual([1, 2])

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
