import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor top/bottom connections auto rotate", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance="0.1uF"
        footprint="0402"
        connections={{ top: "net.VCC", bottom: "net.GND" }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const schematicComponent = circuit.db.schematic_component.list()[0]
  expect(schematicComponent.symbol_name).toBe("capacitor_up")

  expect(
    circuit.db.source_trace
      .list()
      .map((t) => t.display_name)
      .sort(),
  ).toMatchInlineSnapshot(`
    [
      "capacitor.C1 > port.pin1 to net.GND",
      "capacitor.C1 > port.pin2 to net.VCC",
    ]
  `)
})
