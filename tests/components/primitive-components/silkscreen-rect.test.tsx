import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SilkscreenRect rendering", () => {
  const { project } = getTestFixture()
  project.add(
    <board width="10mm" height="10mm">
      <silkscreenrect
        pcbX={2}
        pcbY={3}
        width={"2mm"}
        height={"1.5mm"}
        layer="bottom"
      />
      <silkscreenrect
        pcbX={2}
        pcbY={-3}
        width={"2mm"}
        height={"1.5mm"}
        layer="top"
        filled
      />
    </board>,
  )
  project.render()

  const silkscreenRects = project.db.pcb_silkscreen_rect.list()

  expect(silkscreenRects.length).toBe(2)
  expect(silkscreenRects[0].center.x).toBe(2)
  expect(silkscreenRects[0].center.y).toBe(3)
  expect(silkscreenRects[0].width).toBe(2)
  expect(silkscreenRects[0].height).toBe(1.5)
  expect(silkscreenRects[0].layer).toBe("bottom")

  expect(project).toMatchPcbSnapshot(import.meta.path)
})

test("SilkscreenRect footprint positions respect chip pcbX/pcbY", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <chip
        name="U1"
        pcbX={5}
        pcbY={6}
        footprint={
          <footprint>
            <silkscreenrect pcbX={1} pcbY={2} width={1} height={2} />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const silkscreenRects = circuit.db.pcb_silkscreen_rect.list()

  expect(silkscreenRects.length).toBe(1)
  expect(silkscreenRects[0].center.x).toBe(6)
  expect(silkscreenRects[0].center.y).toBe(8)
})
