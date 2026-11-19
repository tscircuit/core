import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<fuse /> component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <fuse
        name="F1"
        currentRating="10"
        voltageRating="220"
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})

test("<fuse /> schShowRatings={false}", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <fuse
        name="F1"
        currentRating="1A"
        voltageRating="24V"
        schShowRatings={false}
        pcbX={0}
        pcbY={0}
      />
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()
  const schComponent = circuitJson.find(
    (c: any) => c.type === "schematic_component",
  ) as any
  expect(schComponent.symbol_display_value).toBe("")
})

test("<fuse /> omits missing voltageRating from display values", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="12mm" height="10mm">
      <fuse name="F_CUR" currentRating="1A" pcbX={-2} pcbY={0} />
    </board>,
  )

  circuit.render()

  const schComponents = circuit.db.schematic_component.list()
  const srcComponents = circuit.db.source_component.list() as any[]
  const fCurSrc = srcComponents.find((c) => c.name === "F_CUR")

  expect(fCurSrc.display_current_rating).toBe("1A")
  expect(fCurSrc.display_voltage_rating).toBeUndefined()

  const fCurSch = schComponents.find(
    (s) => s.source_component_id === fCurSrc.source_component_id,
  ) as any
  expect(fCurSch.symbol_display_value).toBe("1A")
})
