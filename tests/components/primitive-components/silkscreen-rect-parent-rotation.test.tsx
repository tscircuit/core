import { expect, test } from "bun:test"
import type { SilkscreenRect } from "lib/components/primitive-components/SilkscreenRect"
import { Fragment } from "react"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("silkscreen rectangles follow the same placement as their corner paths", async () => {
  const { circuit } = getTestFixture()
  const corners = [
    { x: -3, y: -1 },
    { x: 3, y: -1 },
    { x: 3, y: 1 },
    { x: -3, y: 1 },
  ]
  circuit.add(
    <board width={65} height={48} routingDisabled>
      {(["top", "bottom"] as const).flatMap((layer, side) =>
        [0, 15].flatMap((groupCcwRotationDegrees, row) =>
          [0, 45, 90, 180, 270].map((ccwRotationDegrees, column) => (
            <Fragment
              key={`${layer}-${groupCcwRotationDegrees}-${ccwRotationDegrees}`}
            >
              <pcbnotetext
                text={`${layer} ${ccwRotationDegrees}+${groupCcwRotationDegrees}deg`}
                pcbX={column * 12 - 24}
                pcbY={20 - (side * 2 + row) * 12}
                fontSize={0.6}
              />
              <group
                pcbX={column * 12 - 24}
                pcbY={16 - (side * 2 + row) * 12}
                pcbRotation={groupCcwRotationDegrees}
              >
                <chip
                  name={`U${side}${row}${column}`}
                  layer={layer}
                  pcbRotation={ccwRotationDegrees}
                  footprint={
                    <footprint>
                      <silkscreenrect pcbX={1} pcbY={1} width={6} height={2} />
                      <silkscreenpath
                        route={[...corners, corners[0]].map((point) =>
                          applyToPoint(translate(1, 1), point),
                        )}
                      />
                    </footprint>
                  }
                />
              </group>
            </Fragment>
          )),
        ),
      )}
    </board>,
  )
  circuit.render()
  for (const silkscreenRect of circuit.selectAll(
    "silkscreenrect",
  ) as SilkscreenRect[]) {
    const rect = circuit.db.pcb_silkscreen_rect.get(
      silkscreenRect.pcb_silkscreen_rect_id!,
    )!
    const path = circuit.db.pcb_silkscreen_path
      .list()
      .find((path) => path.pcb_component_id === rect.pcb_component_id)!
    const rectLocalToBoardTransform = compose(
      translate(rect.center.x, rect.center.y),
      rotateDEG(rect.ccw_rotation ?? 0),
    )
    for (const point of path.route.slice(0, 4)) {
      const distance = Math.min(
        ...[-1, 1].flatMap((x) =>
          [-1, 1].map((y) => {
            const corner = applyToPoint(rectLocalToBoardTransform, {
              x: (x * rect.width) / 2,
              y: (y * rect.height) / 2,
            })
            return Math.hypot(point.x - corner.x, point.y - corner.y)
          }),
        ),
      )
      expect(distance).toBeLessThan(0.000001)
    }
    const { width, height } = silkscreenRect.getPcbSize()
    const boardXs = path.route.map((point) => point.x)
    const boardYs = path.route.map((point) => point.y)
    expect(width).toBeCloseTo(Math.max(...boardXs) - Math.min(...boardXs), 6)
    expect(height).toBeCloseTo(Math.max(...boardYs) - Math.min(...boardYs), 6)
    expect(rect.layer).toBe(path.layer)
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
