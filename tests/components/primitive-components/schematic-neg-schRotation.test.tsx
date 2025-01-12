import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic symbol rotation -90 degrees", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        schRotation={-90}
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot("neg-90-" + import.meta.path)
})

test("schematic symbol rotation -180 degrees", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        schRotation={-180}
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot("neg-180-" + import.meta.path)
})

test("schematic symbol rotation -270 degrees", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        schRotation={-270}
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot("neg-270-" + import.meta.path)
})

test("schematic symbol rotation -360 degrees", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <capacitor
        name="C1"
        capacitance="100nF"
        footprint="0402"
        schRotation={-360}
      />
    </board>,
  )
  circuit.render()
  expect(circuit).toMatchSchematicSnapshot("neg-360-" + import.meta.path)
})
