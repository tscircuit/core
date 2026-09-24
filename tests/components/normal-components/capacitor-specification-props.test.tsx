import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor accepts documented tolerance, temperatureCoefficient, and equivalentSeriesResistance props", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        tolerance="±10%"
      />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="0402"
        temperatureCoefficient="X7R"
      />
      <capacitor
        name="C3"
        capacitance="100nF"
        footprint="0402"
        equivalentSeriesResistance="0.5Ω"
      />
    </board>,
  )

  project.render()

  const capacitors = project.db.source_component.list({
    ftype: "simple_capacitor",
  }) as Array<{
    ftype: "simple_capacitor"
    name: string
    capacitance: number
  }>

  expect(capacitors).toHaveLength(3)
  expect(capacitors.map((c) => c.name)).toEqual(["C1", "C2", "C3"])
  for (const cap of capacitors) {
    expect(cap.capacitance).toBeCloseTo(1e-7)
  }
})
