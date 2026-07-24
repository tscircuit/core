import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("chip emits warnings when schWidth or schHeight cannot fit all pins", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        schWidth={0.1}
        schHeight={0.1}
        schPortArrangement={{
          leftSide: [1, 2],
          bottomSide: [3, 4],
          rightSide: [5, 6],
          topSide: [7, 8],
        }}
        pinLabels={{
          pin1: "L1",
          pin2: "L2",
          pin3: "B1",
          pin4: "B2",
          pin5: "R1",
          pin6: "R2",
          pin7: "T1",
          pin8: "T2",
        }}
      />
      <chip
        name="U2"
        schX={2}
        schWidth={0.2}
        schHeight={0.2}
        schPortArrangement={{
          leftSide: [1, 2],
          bottomSide: [3, 4],
          rightSide: [5, 6],
          topSide: [7, 8],
        }}
        pinLabels={{
          pin1: "L1",
          pin2: "L2",
          pin3: "B1",
          pin4: "B2",
          pin5: "R1",
          pin6: "R2",
          pin7: "T1",
          pin8: "T2",
        }}
      />
    </board>,
  )

  circuit.render()

  const warnings = circuit.db.source_property_ignored_warning.list()

  expect(warnings).toHaveLength(2)
  expect(warnings.map((warning) => warning.property_name)).toEqual([
    "schWidth",
    "schHeight",
  ])
  expect(warnings[0].message).toContain(
    "schWidth=0.1mm, which is too small to display all of its pins. Set schWidth to at least 0.2mm.",
  )
  expect(warnings[1].message).toContain(
    "schHeight=0.1mm, which is too small to display all of its pins. Set schHeight to at least 0.2mm.",
  )
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
