import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("root exposeNets reuses explicit ports and exposes remaining local nets", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  circuit.add(
    <subcircuit name="FILTER" exposeNets schMaxTraceDistance={100}>
      <port name="IN" direction="left" connectsTo="R1.pin1" />
      <resistor
        name="R1"
        resistance="1k"
        schX={0}
        schY={0}
        connections={{ pin1: "net.IN", pin2: "net.OUT" }}
      />
      <capacitor
        name="C1"
        capacitance="100nF"
        schX={3}
        schY={0}
        connections={{ pin1: "net.OUT", pin2: "net.GND" }}
      />
    </subcircuit>,
  )
  await circuit.renderUntilSettled()
  const publicPorts = circuit.db.source_port
    .list()
    .filter((port) => port.source_group_id)
  expect(publicPorts.map((port) => port.name).sort()).toEqual([
    "GND",
    "IN",
    "OUT",
  ])
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
