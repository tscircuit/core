import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreenrect cornerRadius sets corner_radius", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        footprint={
          <footprint>
            <silkscreenrect
              width="3mm"
              height="2mm"
              cornerRadius={0.25}
              layer="top"
            />
            <silkscreenrect
              pcbX={4}
              width="2mm"
              height="2mm"
              cornerRadius={0.25}
              layer="bottom"
              filled
            />
          </footprint>
        }
      />
    </board>,
  )

  project.render()

  const silkscreenRects = project.db.pcb_silkscreen_rect.list()
  expect(silkscreenRects).toHaveLength(2)
  expect(silkscreenRects[0].corner_radius).toBe(0.25)
  expect(silkscreenRects[1].corner_radius).toBe(0.25)
})
