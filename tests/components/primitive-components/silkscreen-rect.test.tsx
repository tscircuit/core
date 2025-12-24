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

test("SilkscreenRect footprint rotation respects chip pcbRotation", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm">
      <chip
        name="U1"
        pcbX={-5}
        pcbY={0}
        pcbRotation="0deg"
        footprint={
          <footprint>
            <silkscreenrect pcbX={1} pcbY={2} width={1} height={2} />
            <silkscreentext pcbX={-1} pcbY={-2} text="R0" />
          </footprint>
        }
      />
      <chip
        name="U2"
        pcbX={0}
        pcbY={0}
        pcbRotation="90deg"
        footprint={
          <footprint>
            <silkscreenrect pcbX={1} pcbY={2} width={1} height={2} />
            <silkscreentext pcbX={-1} pcbY={-2} text="R90" />
          </footprint>
        }
      />
      <chip
        name="U3"
        pcbX={5}
        pcbY={0}
        pcbRotation="270deg"
        footprint={
          <footprint>
            <silkscreenrect pcbX={1} pcbY={2} width={1} height={2} />
            <silkscreentext pcbX={-1} pcbY={-2} text="R270" />
          </footprint>
        }
      />
    </board>,
  )

  circuit.render()

  const silkscreenRects = circuit.db.pcb_silkscreen_rect.list()
  const findRectAt = (x: number, y: number) => {
    const tolerance = 1e-6
    return silkscreenRects.find(
      (rect) =>
        Math.abs(rect.center.x - x) < tolerance &&
        Math.abs(rect.center.y - y) < tolerance,
    )
  }

  const rect0 = findRectAt(-4, 2)
  const rect90 = findRectAt(-2, 1)
  const rect270 = findRectAt(7, -1)

  expect(rect0).toBeDefined()
  expect(rect0?.width).toBe(1)
  expect(rect0?.height).toBe(2)

  expect(rect90).toBeDefined()
  expect(rect90?.width).toBe(2)
  expect(rect90?.height).toBe(1)

  expect(rect270).toBeDefined()
  expect(rect270?.width).toBe(2)
  expect(rect270?.height).toBe(1)

  expect(circuit).toMatchPcbSnapshot(`${import.meta.path}-rotations`)
})
