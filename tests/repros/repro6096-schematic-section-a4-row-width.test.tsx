import React from "react"
import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const CAPS: Record<string, number> = { A: 12, B: 8, C: 8, D: 4, E: 4 }
const sch = (section: string) => ({
  schSheetName: "main",
  schSectionName: section,
})

test("wraps schematic section rows to fit within default A4 sheet drawing width", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="40mm" routingDisabled>
      <schematicsheet name="main" displayName="Main">
        {Object.keys(CAPS).map((s) => (
          <React.Fragment key={s}>
            <schematicsection name={s} displayName={`Section ${s}`} />
          </React.Fragment>
        ))}
      </schematicsheet>
      {Object.entries(CAPS).map(([s, n], j) => (
        <React.Fragment key={s}>
          <chip name={`U${j + 1}`} footprint="soic16" {...sch(s)} />
          {Array.from({ length: n }, (_, i) => {
            const c = `C${100 * j + i + 1}`
            return (
              <React.Fragment key={c}>
                <capacitor
                  name={c}
                  capacitance="1uF"
                  footprint="0603"
                  {...sch(s)}
                />
                <trace
                  from={`.U${j + 1} > .pin${i + 1}`}
                  to={`.${c} > .pin1`}
                />
                <trace from={`.${c} > .pin2`} to="net.GND" />
              </React.Fragment>
            )
          })}
        </React.Fragment>
      ))}
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.schematic_element_outside_sheet_warning.list()).toEqual([])

  const chipCentersByName = new Map(
    circuit.db.source_component
      .list()
      .filter((sc) => sc.name.startsWith("U"))
      .map((sc) => {
        const schComp = circuit.db.schematic_component.getWhere({
          source_component_id: sc.source_component_id,
        })
        return [sc.name, schComp!.center] as const
      }),
  )

  // Sections A (U1) and B (U2) fit on the top row; Section C (U3) wraps to the second row
  expect(chipCentersByName.get("U3")!.y).toBeLessThan(
    chipCentersByName.get("U1")!.y - 3,
  )
  expect(chipCentersByName.get("U3")!.y).toBeLessThan(
    chipCentersByName.get("U2")!.y - 3,
  )
})

test("allows wider schematic section rows on larger ANSI B sheets", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="40mm" routingDisabled>
      <schematicsheet name="main" displayName="Main" sheetSize="ANSI_B">
        {Object.keys(CAPS).map((s) => (
          <React.Fragment key={s}>
            <schematicsection name={s} displayName={`Section ${s}`} />
          </React.Fragment>
        ))}
      </schematicsheet>
      {Object.entries(CAPS).map(([s, n], j) => (
        <React.Fragment key={s}>
          <chip name={`U${j + 1}`} footprint="soic16" {...sch(s)} />
          {Array.from({ length: n }, (_, i) => {
            const c = `C${100 * j + i + 1}`
            return (
              <React.Fragment key={c}>
                <capacitor
                  name={c}
                  capacitance="1uF"
                  footprint="0603"
                  {...sch(s)}
                />
                <trace
                  from={`.U${j + 1} > .pin${i + 1}`}
                  to={`.${c} > .pin1`}
                />
                <trace from={`.${c} > .pin2`} to="net.GND" />
              </React.Fragment>
            )
          })}
        </React.Fragment>
      ))}
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.schematic_element_outside_sheet_warning.list()).toEqual([])

  const chipCentersByName = new Map(
    circuit.db.source_component
      .list()
      .filter((sc) => sc.name.startsWith("U"))
      .map((sc) => {
        const schComp = circuit.db.schematic_component.getWhere({
          source_component_id: sc.source_component_id,
        })
        return [sc.name, schComp!.center] as const
      }),
  )

  // On ANSI B (431.8 x 279.4 mm), Sections A, B, and C all fit on the first row above Section D
  expect(chipCentersByName.get("U3")!.y).toBeGreaterThan(
    chipCentersByName.get("U4")!.y + 3,
  )
})
