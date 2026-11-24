import { expect, test } from "bun:test"
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

test("uppercase U/N RKM separators are normalized to micro/nano", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="2U2" footprint="0402" pcbX={0} pcbY={0} />
      <resistor name="R2" resistance="4N7" footprint="0402" pcbX={5} pcbY={0} />
      <capacitor
        name="C1"
        capacitance="4P7"
        footprint="0402"
        pcbX={0}
        pcbY={5}
      />
    </board>,
  )

  project.render()

  const resistors = project.db.source_component.list({
    ftype: "simple_resistor",
  }) as Array<{ name?: string; resistance: number }>
  const capacitors = project.db.source_component.list({
    ftype: "simple_capacitor",
  }) as Array<{ name?: string; capacitance: number }>

  const rByName = Object.fromEntries(resistors.map((r) => [r.name, r]))
  const cByName = Object.fromEntries(capacitors.map((c) => [c.name, c]))

  // Uppercase U (micro) and N (nano) are not SI symbols; they must be
  // lowercased so circuit-json applies the correct multiplier.
  expect(rByName.R1.resistance).toBeCloseTo(0.0000022, 15) // 2U2 -> 2.2u -> 2.2µΩ
  expect(rByName.R2.resistance).toBeCloseTo(0.0000000047, 18) // 4N7 -> 4.7n -> 4.7nΩ
  // Uppercase P is pico in the capacitor-marking convention.
  expect(cByName.C1.capacitance).toBeCloseTo(0.0000000000047, 21) // 4P7 -> 4.7p -> 4.7pF
})
