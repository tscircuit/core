import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("inductor stores inductance as a parsed number when given an SI string", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <inductor
        name="L1"
        inductance="10µH"
        footprint="0402"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  circuit.render()

  const inductors = circuit.db.source_component.list({
    ftype: "simple_inductor",
  }) as Array<{
    ftype: "simple_inductor"
    inductance: number
    display_inductance?: string
  }>

  expect(inductors).toHaveLength(1)
  // inductance is stored in henries as a number, not the raw "10µH" string
  expect(typeof inductors[0].inductance).toBe("number")
  expect(inductors[0].inductance).toBeCloseTo(0.00001, 12)
  expect(inductors[0].display_inductance).toBe("10µH")

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
