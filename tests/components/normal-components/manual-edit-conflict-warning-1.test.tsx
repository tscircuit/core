import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic conflict warning triggered for resistor", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      manualEdits={{
        schematic_placements: [
          {
            selector: "R1",
            center: { x: 5, y: 5 },
            relative_to: "group_center",
          },
        ],
      }}
    >
      <resistor name="R1" resistance="10k" footprint="0402" schX={2} schY={2} />
    </board>,
  )

  circuit.render()

  const warnings = circuit.db.schematic_manual_edit_conflict_warning.list()
  expect(warnings).toHaveLength(1)
  const warning = warnings[0]
  expect(warning.message).toMatch(
    /has both manual placement and prop coordinates/,
  )
  expect(warning.schematic_component_id).toBeDefined()
  expect(warning.source_component_id).toBeDefined()
  expect(warning.subcircuit_id).toBeDefined()
})

test("schematic conflict warning triggered for capacitor", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      manualEdits={{
        schematic_placements: [
          {
            selector: "C1",
            center: { x: 10, y: 10 },
            relative_to: "group_center",
          },
        ],
      }}
    >
      <capacitor
        name="C1"
        capacitance="1uF"
        footprint="0402"
        schX={3}
        schY={3}
      />
    </board>,
  )

  circuit.render()

  const warnings = circuit.db.schematic_manual_edit_conflict_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0].message).toMatch(
    /has both manual placement and prop coordinates/,
  )
})

test("schematic conflict warning triggered for LED", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      manualEdits={{
        schematic_placements: [
          {
            selector: "LED1",
            center: { x: 0, y: 0 },
            relative_to: "board_center",
          },
        ],
      }}
    >
      <led name="LED1" footprint="0603" schX={1} schY={1} />
    </board>,
  )

  circuit.render()

  const warnings = circuit.db.schematic_manual_edit_conflict_warning.list()
  expect(warnings).toHaveLength(1)
  expect(warnings[0].message).toMatch(
    /has both manual placement and prop coordinates/,
  )
})

test("no schematic conflict when only manual edit defined", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      manualEdits={{
        schematic_placements: [
          {
            selector: "R2",
            center: { x: 2, y: 2 },
            relative_to: "group_center",
          },
        ],
      }}
    >
      <resistor name="R2" resistance="1k" footprint="0402" />
    </board>,
  )

  circuit.render()

  const warnings = circuit.db.schematic_manual_edit_conflict_warning.list()
  expect(warnings).toHaveLength(0)
})

test("no schematic conflict when only schX/schY defined", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor name="R3" resistance="470" footprint="0402" schX={4} schY={4} />
    </board>,
  )

  circuit.render()

  const warnings = circuit.db.schematic_manual_edit_conflict_warning.list()
  expect(warnings).toHaveLength(0)
})

test("no schematic conflict when neither schX/schY nor manual edit", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <led name="LED2" footprint="0603" />
    </board>,
  )

  circuit.render()

  const warnings = circuit.db.schematic_manual_edit_conflict_warning.list()
  expect(warnings).toHaveLength(0)
})
