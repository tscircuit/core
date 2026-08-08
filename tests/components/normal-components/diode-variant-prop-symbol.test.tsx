import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// The `variant` prop and the boolean shortcuts (schottky/zener/...) are meant to
// be equivalent: @tscircuit/props normalizes `variant="zener"` to `zener: true`.
// The boolean spelling already picks the right schematic symbol; the `variant`
// spelling must select the same symbol.
test("diode variant prop selects the matching schematic symbol", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="30mm" height="20mm">
      <diode name="D1" variant="schottky" schX={-4} />
      <diode name="D2" variant="zener" schX={-2} />
      <diode name="D3" variant="avalanche" schX={0} />
      <diode name="D4" variant="photo" schX={2} />
      <diode name="D5" variant="standard" schX={4} />
    </board>,
  )
  circuit.render()

  const symbolByName = (name: string) => {
    const src = circuit.db.source_component
      .list()
      .find((c: any) => c.name === name)
    const sc = circuit.db.schematic_component
      .list()
      .find((c: any) => c.source_component_id === src!.source_component_id)
    return (sc as any)?.symbol_name as string
  }

  // orientation suffix is layout-dependent, so match the symbol family only
  expect(symbolByName("D1")).toContain("schottky_diode")
  expect(symbolByName("D2")).toContain("zener_diode")
  expect(symbolByName("D3")).toContain("avalanche_diode")
  expect(symbolByName("D4")).toContain("photodiode")
  // standard variant keeps the plain diode symbol
  expect(symbolByName("D5")).toContain("diode")
  expect(symbolByName("D5")).not.toContain("zener")
})
