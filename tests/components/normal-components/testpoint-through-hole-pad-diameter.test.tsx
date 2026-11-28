import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<testpoint /> through_hole uses padDiameter for the plated hole copper", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <pcbnotetext text="HOLE 1MM / PAD 2.5MM" pcbY={3.5} fontSize={0.8} />
      <testpoint
        name="TP1"
        footprintVariant="through_hole"
        holeDiameter="1mm"
        padDiameter="2.5mm"
      />
    </board>,
  )

  circuit.render()

  const platedHole = circuit.db.pcb_plated_hole.list()[0]
  expect(platedHole).toMatchObject({
    shape: "circle",
    hole_diameter: 1,
    outer_diameter: 2.5,
  })

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})

test("<testpoint /> through_hole reports padDiameter not larger than holeDiameter", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <testpoint
        name="TP1"
        footprintVariant="through_hole"
        holeDiameter="1mm"
        padDiameter="0.8mm"
      />
    </board>,
  )

  circuit.render()

  const platedHole = circuit.db.pcb_plated_hole.list()[0]
  expect(platedHole).toMatchObject({
    shape: "circle",
    hole_diameter: 1,
    outer_diameter: 1.5,
  })

  const errors = circuit.db.source_invalid_component_property_error.list()
  expect(errors).toHaveLength(1)
  expect(errors[0]).toMatchObject({ property_name: "padDiameter" })
  expect(errors[0].message).toContain('testpoint "TP1"')
})
