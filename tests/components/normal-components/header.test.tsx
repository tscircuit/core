import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("header with default pinrow footprint", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <pinheader
        name="J1"
        pinCount={4}
        pinLabels={["label1", "label2", "label3", "label4"]}
        pitch="2.54mm"
        gender="male"
        showSilkscreenPinLabels={true}
      />
    </board>,
  )

  project.render()

  // Check if header component was created
  const header = project.selectOne("pinheader")

  expect(header).not.toBeNull()
  expect(header!.props.name).toBe("J1")

  // Check PCB primitives
  const platedHoles = project.db.pcb_plated_hole.list()
  expect(platedHoles).toHaveLength(4)

  // Verify pin spacing
  const holePositions = platedHoles.map((h) => h.x).sort((a, b) => a - b)
  const spacing = holePositions[1] - holePositions[0]
  expect(spacing).toBeCloseTo(2.54, 2)

  expect(project).toMatchPcbSnapshot(import.meta.path)
  expect(project).toMatchSchematicSnapshot(import.meta.path)
})
