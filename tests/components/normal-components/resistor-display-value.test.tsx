import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resistor display_value property", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )

  project.render()

  const resistors = project.db.source_component.list({
    ftype: "simple_resistor",
  }) as Array<{
    ftype: "simple_resistor"
    display_resistance?: string
  }>

  expect(resistors).toHaveLength(1)
  expect(resistors[0].display_resistance).toBe("10kΩ")
})

test("resistor display_tolerance property", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        tolerance="5%"
        footprint="0402"
        pcbX={0}
        pcbY={0}
      />
      <resistor
        name="R2"
        resistance="10k"
        tolerance="7%"
        footprint="0402"
        pcbX={3}
        pcbY={0}
      />
      <resistor
        name="R3"
        resistance="10k"
        tolerance={0.001}
        footprint="0402"
        pcbX={6}
        pcbY={0}
      />
      <resistor name="R4" resistance="10k" footprint="0402" pcbX={9} pcbY={0} />
    </board>,
  )

  project.render()

  const resistors = project.db.source_component.list({
    ftype: "simple_resistor",
  }) as Array<{
    name: string
    display_tolerance?: string
  }>

  const toleranceByName = Object.fromEntries(
    resistors.map((r) => [r.name, r.display_tolerance]),
  )

  expect(toleranceByName.R1).toBe("5%")
  expect(toleranceByName.R2).toBe("7%")
  expect(toleranceByName.R3).toBe("0.1%")
  expect(toleranceByName.R4).toBeUndefined()
})
