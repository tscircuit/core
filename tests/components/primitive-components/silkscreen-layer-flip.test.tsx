import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("Silkscreen elements respect parent component layer", () => {
  const { project } = getTestFixture()

  project.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" layer="bottom">
        <silkscreenline
          x1={-2}
          y1={-2}
          x2={2}
          y2={2}
          layer="top"
          strokeWidth={0.1}
        />
        <silkscreenrect
          pcbX={0}
          pcbY={0}
          width={1}
          height={1}
          layer="top"
          strokeWidth={0.1}
        />
        <silkscreencircle
          pcbX={0}
          pcbY={0}
          radius={1}
          layer="top"
          strokeWidth={0.1}
        />
        <silkscreenpath
          route={[
            { x: 0, y: 0 },
            { x: 1, y: 1 },
          ]}
          layer="top"
          strokeWidth={0.1}
        />
        <silkscreentext text="Test" pcbX={0} pcbY={0} layer="top" />
      </resistor>
    </board>,
  )

  project.render()

  // Check that all silkscreen elements have been flipped to bottom layer
  const silkscreenLines = project.db.pcb_silkscreen_line.list()
  expect(silkscreenLines.length).toBe(1)
  expect(silkscreenLines[0].layer).toBe("bottom")

  const silkscreenRects = project.db.pcb_silkscreen_rect.list()
  expect(silkscreenRects.length).toBe(1)
  expect(silkscreenRects[0].layer).toBe("bottom")

  const silkscreenCircles = project.db.pcb_silkscreen_circle.list()
  expect(silkscreenCircles.length).toBe(1)
  expect(silkscreenCircles[0].layer).toBe("bottom")

  const silkscreenPaths = project.db.pcb_silkscreen_path.list()
  expect(silkscreenPaths.length).toBe(1)
  expect(silkscreenPaths[0].layer).toBe("bottom")

  const silkscreenTexts = project.db.pcb_silkscreen_text.list()
  expect(silkscreenTexts.length).toBe(1)
  expect(silkscreenTexts[0].layer).toBe("bottom")

  expect(project).toMatchPcbSnapshot(import.meta.path)
})
