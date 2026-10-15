import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("partial pin labels preserve unlabelled switch terminals and their traces", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board>
      <schematictext
        text="Partial pinLabels rename pin1; pin2 must remain connectable"
        schY={2.3}
        fontSize={0.22}
      />
      <switch
        name="SW1"
        type="spst"
        schX={-3}
        pinLabels={{ pin1: "IN" }}
        connections={{ pin1: "net.INPUT1", pin2: "net.OUTPUT1" }}
      />
      <schematictext
        text="SW1: built-in symbol"
        schX={-3}
        schY={1.5}
        fontSize={0.18}
      />
      <switch
        name="SW2"
        type="spst"
        schX={3}
        pinLabels={{ pin1: "IN" }}
        symbol={
          <symbol>
            <schematicrect width={0.9} height={0.4} strokeWidth={0.03} />
            <schematictext text="{NAME}" schY={0.7} fontSize={0.18} />
          </symbol>
        }
        connections={{ pin1: "net.INPUT2", pin2: "net.OUTPUT2" }}
      />
      <schematictext
        text="SW2: custom drawing with no ports"
        schX={3}
        schY={1.5}
        fontSize={0.18}
      />
      <schematictext
        text="Both switches must keep electrical pins 1 and 2 and both schematic wires"
        schY={-1.3}
        fontSize={0.18}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  for (const name of ["SW1", "SW2"]) {
    const component = circuit.db.source_component.getWhere({ name })!
    const ports = circuit.db.source_port
      .list()
      .filter(
        (port) => port.source_component_id === component.source_component_id,
      )
    expect(ports.map((port) => port.pin_number).sort()).toEqual([1, 2])
    for (const port of ports) {
      const schematicPort = circuit.db.schematic_port.getWhere({
        source_port_id: port.source_port_id,
      })
      expect(schematicPort).toBeDefined()
      expect(
        circuit.db.source_trace
          .list()
          .some((trace) =>
            trace.connected_source_port_ids.includes(port.source_port_id),
          ),
      ).toBe(true)
    }
  }
  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(circuit.db.schematic_trace.list()).toHaveLength(4)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
    width: 1200,
    height: 600,
  })
})
