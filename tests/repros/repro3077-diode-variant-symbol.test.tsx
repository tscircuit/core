import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("diode variant prop selects the matching schematic symbol (#3077)", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="20mm">
      <diode name="D1" variant="schottky" schX={-6} />
      <diode name="D1_BOOL" schottky schX={-6} schY={2} />
      <diode name="D2" variant="zener" schX={-3} />
      <diode name="D2_BOOL" zener schX={-3} schY={2} />
      <diode name="D3" variant="avalanche" schX={0} />
      <diode name="D3_BOOL" avalanche schX={0} schY={2} />
      <diode name="D4" variant="photo" schX={3} />
      <diode name="D4_BOOL" photo schX={3} schY={2} />
      <diode name="D5" variant="standard" schX={6} />
    </board>,
  )

  circuit.render()

  const symbolByName = (name: string) => {
    const src = circuit.db.source_component.list().find((c) => c.name === name)
    const sc = circuit.db.schematic_component
      .list()
      .find((c) => c.source_component_id === src?.source_component_id)
    return sc?.symbol_name
  }

  expect(symbolByName("D1")).toBe("schottky_diode_right")
  expect(symbolByName("D1")).toBe(symbolByName("D1_BOOL"))

  expect(symbolByName("D2")).toContain("zener_diode")
  expect(symbolByName("D2")).toBe(symbolByName("D2_BOOL"))

  expect(symbolByName("D3")).toBe("avalanche_diode_right")
  expect(symbolByName("D3")).toBe(symbolByName("D3_BOOL"))

  expect(symbolByName("D4")).toContain("photodiode")
  expect(symbolByName("D4")).toBe(symbolByName("D4_BOOL"))

  expect(symbolByName("D5")).toBe("diode_right")
})
