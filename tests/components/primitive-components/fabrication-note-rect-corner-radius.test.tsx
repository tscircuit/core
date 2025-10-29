import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fabricationnoterect cornerRadius sets corner_radius", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <fabricationnoterect
              width="3mm"
              height="2mm"
              cornerRadius={0.25}
              layer="top"
              color="green"
            />
            <fabricationnoterect
              pcbX={4}
              width="2mm"
              height="2mm"
              cornerRadius={0.25}
              layer="bottom"
              isFilled
            />
          </footprint>
        }
      />
    </board>,
  )

  project.render()

  const fabricationNoteRects = project.db.pcb_fabrication_note_rect.list()
  expect(fabricationNoteRects).toHaveLength(2)
  expect(fabricationNoteRects[0].corner_radius).toBe(0.25)
  expect(fabricationNoteRects[1].corner_radius).toBe(0.25)
})
