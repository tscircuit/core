import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen components should respect parent component layer", () => {
  const { project } = getTestFixture()
  project.add(
    <board width="10mm" height="10mm">
      <group layer="bottom">
        {/* Test all silkscreen primitives respect parent layer */}
        <silkscreenline x1={0} y1={0} x2={5} y2={5} strokeWidth={0.2} />
        <silkscreentext text="Test" pcbX={2} pcbY={2} />
        <silkscreenrect width={2} height={2} pcbX={4} pcbY={4} />
        <silkscreenpath
          route={[
            { x: 0, y: 0 },
            { x: 2, y: 2 },
            { x: 4, y: 0 },
          ]}
          strokeWidth={0.2}
        />
      </group>
    </board>,
  )
  project.render()

  // Check silkscreen line
  const lines = project.db.pcb_silkscreen_line.list()
  expect(lines.length).toBe(1)
  expect(lines[0].layer).toBe("bottom")

  // Check silkscreen text
  const texts = project.db.pcb_silkscreen_text.list()
  expect(texts.length).toBe(1)
  expect(texts[0].layer).toBe("bottom")

  // Check silkscreen rect
  const rects = project.db.pcb_silkscreen_rect.list()
  expect(rects.length).toBe(1)
  expect(rects[0].layer).toBe("bottom")

  // Check silkscreen path
  const paths = project.db.pcb_silkscreen_path.list()
  expect(paths.length).toBe(1)
  expect(paths[0].layer).toBe("bottom")

  expect(project).toMatchPcbSnapshot(import.meta.path)
})
