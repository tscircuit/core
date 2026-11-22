import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resistor RKM notation resistance is parsed with fractional digits", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="4k7" footprint="0402" pcbX={0} pcbY={0} />
      <resistor name="R2" resistance="2u2" footprint="0402" pcbX={5} pcbY={0} />
      <resistor name="R3" resistance="1R5" footprint="0402" pcbX={0} pcbY={5} />
      <resistor name="R4" resistance="10k" footprint="0402" pcbX={5} pcbY={5} />
    </board>,
  )

  project.render()

  const resistors = project.db.source_component.list({
    ftype: "simple_resistor",
  }) as Array<{
    name?: string
    resistance: number
    display_resistance?: string
  }>

  const byName = Object.fromEntries(resistors.map((r) => [r.name, r]))

  // RKM notation: the trailing digits are the fractional part of the mantissa.
  expect(byName.R1.resistance).toBe(4700) // 4k7 -> 4.7k -> 4700Ω
  expect(byName.R2.resistance).toBe(0.0000022) // 2u2 -> 2.2u -> 2.2µF
  expect(byName.R3.resistance).toBe(1.5) // 1R5 -> 1.5R -> 1.5Ω
  // Plain values must be unaffected.
  expect(byName.R4.resistance).toBe(10000) // 10k -> 10000Ω

  expect(byName.R1.display_resistance).toBe("4.7kΩ")
  expect(byName.R3.display_resistance).toBe("1.5Ω")
})