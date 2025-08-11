import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("symbolName should be overridden", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board>
      <transistor
        name="Q3"
        type="npn"
        // This should override the symbol name
        symbolName="npn_bipolar_transistor_horz"
      />
    </board>,
  )

  circuit.render()

  const symbols = circuit.db.schematic_component.list()
  expect(symbols.length).toBe(1)
  expect(symbols[0].symbol_name).toBe("npn_bipolar_transistor_horz")
})
