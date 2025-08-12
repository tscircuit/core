import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resonator symbol display value", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resonator name="K1" frequency="8MHz" loadCapacitance="15pF" />
    </board>,
  )

  circuit.render()

  const components = circuit.db.schematic_component.list() as Array<{
    symbol_display_value?: string
  }>

  expect(components).toHaveLength(1)
  expect(components[0].symbol_display_value).toBe("8MHz / 15pF")
})
