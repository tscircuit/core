import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SilkscreenCircle rendering", () => {
  const { project } = getTestFixture()
  project.add(
    <board width="10mm" height="10mm">
      <silkscreencircle
        radius={2}
        pcbX={1}
        pcbY={1}
        layer="top"
        strokeWidth={0.2}
      />
    </board>,
  )
  project.render()

  const silkscreenCircles = project.db.pcb_silkscreen_circle.list()

  expect(silkscreenCircles.length).toBe(1)
  expect(silkscreenCircles[0].layer).toBe("top")
  expect(silkscreenCircles[0].center.x).toBe(1)
  expect(silkscreenCircles[0].center.y).toBe(1)
  expect(silkscreenCircles[0].radius).toBe(2)

  expect(silkscreenCircles[0].stroke_width).toBe(0.2)

  expect(project).toMatchPcbSnapshot(import.meta.path)
})
