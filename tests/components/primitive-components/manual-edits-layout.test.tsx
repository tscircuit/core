import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import manualEdits from "./json/manual-edits.json"

test("Manual edits prop usage", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm" manualEdits={manualEdits}>
      <resistor name="R1" resistance="100" footprint="0402" />
    </board>,
  )

  project.render()

  expect(project).toMatchPcbSnapshot(import.meta.path)
})

test("manualEdits inside a positioned group does not double-count the group anchor", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="40mm"
      height="20mm"
      manualEdits={{
        pcb_placements: [
          {
            selector: "C1",
            center: { x: 11.4, y: 4.3 },
            relative_to: "group_center",
          },
        ],
      }}
    >
      <group name="region" pcbX={16} pcbY={0}>
        <capacitor
          name="C1"
          capacitance="100nF"
          footprint="0402"
          schX={0}
          schY={0}
        />
      </group>
    </board>,
  )

  circuit.render()

  const pcbComponents = circuit.db.pcb_component.list()
  const c1 = pcbComponents.find((c) => c.source_component_id !== undefined)

  // manualEdits center = (11.4, 4.3) board-absolute
  // group anchor is at pcbX=16, group must NOT be added again
  expect(c1?.center.x).toBeCloseTo(11.4, 1)
  expect(c1?.center.y).toBeCloseTo(4.3, 1)
})
