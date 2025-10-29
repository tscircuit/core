import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("pcbnoterect cornerRadius sets corner_radius", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <pcbnoterect
        width="3mm"
        height="2mm"
        cornerRadius={0.25}
        color="red"
      />
      <pcbnoterect
        pcbX={4}
        width="2mm"
        height="2mm"
        cornerRadius={0.25}
        isFilled
        color="blue"
      />
    </board>,
  )

  project.render()

  const pcbNoteRects = project.db.pcb_note_rect.list()
  expect(pcbNoteRects).toHaveLength(2)
  expect(pcbNoteRects[0].corner_radius).toBe(0.25)
  expect(pcbNoteRects[1].corner_radius).toBe(0.25)
})
