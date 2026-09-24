import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schOrientation neg_bottom places the negative pin at the bottom", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance="1uF"
        polarized
        schOrientation="pos_top"
        schX={-1.5}
      />
      <capacitor
        name="C2"
        capacitance="1uF"
        polarized
        schOrientation="neg_bottom"
        schX={1.5}
      />
      <schematictext
        text="pos_top and neg_bottom should match"
        schX={0}
        schY={1.2}
        fontSize={0.2}
      />
    </board>,
  )

  circuit.render()

  const getPortY = (componentName: string, portName: string) => {
    const sourcePort = circuit.db.source_port
      .list()
      .find(
        (port) =>
          port.name === portName &&
          circuit.db.source_component.get(port.source_component_id!)?.name ===
            componentName,
      )!
    return circuit.db.schematic_port.getWhere({
      source_port_id: sourcePort.source_port_id,
    })!.center.y
  }

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)

  const c2 = circuit.db.schematic_component.list()[1]

  expect(getPortY("C1", "pin1")).toBeGreaterThan(getPortY("C1", "pin2"))
  expect(c2.symbol_name).toBe("capacitor_polarized_down")
  expect(getPortY("C2", "pin2")).toBeLessThan(getPortY("C2", "pin1"))
})
