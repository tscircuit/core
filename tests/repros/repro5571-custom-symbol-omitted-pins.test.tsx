import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom schematic symbol omits schematic_port for undeclared PCB pins while preserving source_port and pcb_port (#5571)", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm" routingDisabled>
      <chip
        name="BZ1"
        footprint="sot23"
        pinLabels={{ pin1: "POS", pin2: "NEG", pin3: "NC" }}
        pinAttributes={{ pin3: { doNotConnect: true } }}
        symbol={
          <symbol>
            <schematicrect width={0.4} height={0.4} strokeWidth={0.03} />
            <port
              name="POS"
              pinNumber={1}
              direction="left"
              schX={-0.4}
              schY={0.1}
            />
            <port
              name="NEG"
              pinNumber={2}
              direction="left"
              schX={-0.4}
              schY={-0.1}
            />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const sourcePorts = circuit.db.source_port.list()
  const schematicPorts = circuit.db.schematic_port.list()
  const pcbPorts = circuit.db.pcb_port.list()

  expect(sourcePorts).toHaveLength(3)
  expect(pcbPorts).toHaveLength(3)
  expect(schematicPorts).toHaveLength(2)

  const pin3SourcePort = sourcePorts.find((p) => p.pin_number === 3)
  expect(pin3SourcePort).toBeDefined()
  expect(pin3SourcePort?.do_not_connect).toBe(true)
  expect(
    schematicPorts.find(
      (sp) => sp.source_port_id === pin3SourcePort?.source_port_id,
    ),
  ).toBeUndefined()
})
