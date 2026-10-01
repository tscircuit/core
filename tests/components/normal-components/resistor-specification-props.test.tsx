import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("resistor accepts documented powerRating and temperatureOperatingRange props", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="1k"
        powerRating="5W"
        temperatureOperatingRange="-15F-150F"
        footprint="0402"
      />
    </board>,
  )

  project.render()

  const resistors = project.db.source_component.list({
    ftype: "simple_resistor",
  }) as Array<{
    ftype: "simple_resistor"
    name: string
    resistance: number
  }>

  expect(resistors).toHaveLength(1)
  expect(resistors[0].name).toBe("R1")
  expect(resistors[0].resistance).toBe(1000)
})
