import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("capacitor display_value property with just capacitance", () => {
  const { project, circuit } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance="10µF"
        footprint="0402"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  project.render()

  const capacitors = project.db.source_component.list({
    ftype: "simple_capacitor",
  }) as Array<{
    ftype: "simple_capacitor"
    display_capacitance?: string
  }>

  expect(capacitors).toHaveLength(1)
  expect(capacitors[0].display_capacitance).toBe("10µF")
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-basic-capacitor",
  )
})

test("capacitor display_value property with voltage rating", () => {
  const { project, circuit } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance="10µF"
        maxVoltageRating="50V"
        footprint="0402"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  project.render()

  const capacitors = project.db.source_component.list({
    ftype: "simple_capacitor",
  }) as Array<{
    ftype: "simple_capacitor"
    display_capacitance?: string
    max_voltage_rating?: number
  }>

  expect(capacitors).toHaveLength(1)
  expect(capacitors[0].display_capacitance).toBe("10µF") // Only shows capacitance by default
  expect(capacitors[0].max_voltage_rating).toBe(50) // Still stores the voltage rating
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-basic-capacitor",
  )
})

test("capacitor shows voltage rating when schShowRatings is enabled", () => {
  const { project, circuit } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance="10µF"
        maxVoltageRating="50V"
        schShowRatings={true}
        footprint="0402"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  project.render()

  const capacitors = project.db.source_component.list({
    ftype: "simple_capacitor",
  }) as Array<{
    ftype: "simple_capacitor"
    display_capacitance?: string
    max_voltage_rating?: number
  }>

  expect(capacitors).toHaveLength(1)
  expect(capacitors[0].display_capacitance).toBe("10µF/50V") // Shows both when enabled
  expect(capacitors[0].max_voltage_rating).toBe(50) // Stores the voltage rating
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-capacitor-with-ratings-shown",
  )
})

test("polarized capacitor with voltage rating follows same display rules", () => {
  const { project, circuit } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance="100µF"
        maxVoltageRating="16V"
        polarized={true}
        footprint="0402"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  project.render()

  const capacitors = project.db.source_component.list({
    ftype: "simple_capacitor",
  }) as Array<{
    ftype: "simple_capacitor"
    display_capacitance?: string
    max_voltage_rating?: number
  }>

  expect(capacitors).toHaveLength(1)
  expect(capacitors[0].display_capacitance).toBe("100µF") // Only shows capacitance by default
  expect(capacitors[0].max_voltage_rating).toBe(16) // Stores the voltage rating
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-polarized-capacitor",
  )
})

test("capacitor with numeric values handles display correctly", () => {
  const { project, circuit } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance={0.000001} // 1µF
        maxVoltageRating={25}
        schShowRatings={true}
        footprint="0402"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  project.render()

  const capacitors = project.db.source_component.list({
    ftype: "simple_capacitor",
  }) as Array<{
    ftype: "simple_capacitor"
    display_capacitance?: string
    max_voltage_rating?: number
    capacitance: number
  }>

  expect(capacitors).toHaveLength(1)
  expect(capacitors[0].display_capacitance).toBe("1µF/25V") // Shows both when enabled
  expect(capacitors[0].max_voltage_rating).toBe(25) // Stores the voltage rating
  expect(capacitors[0].capacitance).toBe(0.000001)
  expect(circuit).toMatchSchematicSnapshot(
    import.meta.path + "-capacitor-numeric-values",
  )
})
