import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("LED with an inline footprint renders numeric schematic ports", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <led
        name="LED1"
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX={-0.5}
              pcbY={0}
              width={0.5}
              height={0.5}
              shape="rect"
            />
            <smtpad
              portHints={["pin2"]}
              pcbX={0.5}
              pcbY={0}
              width={0.5}
              height={0.5}
              shape="rect"
            />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const led = circuit.db.source_component
    .list()
    .find((component) => component.name === "LED1")
  const sourcePortIds = circuit.db.source_port
    .list()
    .filter((port) => port.source_component_id === led?.source_component_id)
    .map((port) => port.source_port_id)
  const schematicPorts = circuit.db.schematic_port
    .list()
    .filter((port) => sourcePortIds.includes(port.source_port_id))

  expect(schematicPorts).toHaveLength(2)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
