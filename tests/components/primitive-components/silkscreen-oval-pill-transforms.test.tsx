import { expect, test } from "bun:test"
import type { SilkscreenOval, SilkscreenPill } from "lib/components"
import { Fragment } from "react"
import {
  applyToPoint,
  compose,
  inverse,
  rotateDEG,
  translate,
} from "transformation-matrix"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("oval and horizontal/vertical pill geometry follows footprint transforms on both layers", async () => {
  const { circuit } = getTestFixture()
  // Reference geometry is emitted through SilkscreenPath, independently of the
  // new components. All points are footprint-local mm (+X right, +Y top).
  const ovalRoute = Array.from({ length: 129 }, (_, i) => ({
    x: 3 * Math.cos((i * 2 * Math.PI) / 128),
    y: Math.sin((i * 2 * Math.PI) / 128),
  }))
  const pillRoute = Array.from({ length: 129 }, (_, i) => {
    const angle = (i * 2 * Math.PI) / 128
    return {
      x: (Math.cos(angle) >= 0 ? 2 : -2) + Math.cos(angle),
      y: Math.sin(angle),
    }
  })
  circuit.add(
    <board width={72} height={82} routingDisabled schematicDisabled>
      {(["top", "bottom"] as const).flatMap((layer, side) =>
        [0, 35, 90, 180, 270].flatMap((rotation, column) =>
          ["oval", "horizontal", "vertical"].map((shape, row) => {
            const route =
              shape === "oval"
                ? ovalRoute
                : shape === "horizontal"
                  ? pillRoute
                  : pillRoute.map(({ x, y }) => ({ x: y, y: x }))
            return (
              <Fragment key={`${layer}-${rotation}-${shape}`}>
                <pcbnotetext
                  text={`${layer} ${shape} ${rotation}deg`}
                  pcbX={column * 14 - 28}
                  pcbY={37 - (side * 3 + row) * 13}
                  fontSize={0.5}
                />
                <group
                  pcbX={column * 14 - 28}
                  pcbY={32 - (side * 3 + row) * 13}
                  pcbRotation={15}
                >
                  <chip
                    name={`U${side}${row}${column}`}
                    layer={layer}
                    pcbRotation={rotation}
                    footprint={
                      <footprint>
                        {shape === "oval" ? (
                          <silkscreenoval
                            radiusX={3}
                            radiusY={1}
                            pcbX={1}
                            pcbY={0.5}
                            pcbRotation={20}
                          />
                        ) : (
                          <silkscreenpill
                            width={shape === "horizontal" ? 6 : 2}
                            height={shape === "horizontal" ? 2 : 6}
                            pcbX={1}
                            pcbY={0.5}
                            pcbRotation={20}
                          />
                        )}
                        <silkscreenpath
                          route={route.map((point) =>
                            applyToPoint(
                              compose(translate(1, 0.5), rotateDEG(20)),
                              point,
                            ),
                          )}
                          strokeWidth={0.04}
                        />
                      </footprint>
                    }
                  />
                </group>
              </Fragment>
            )
          }),
        ),
      )}
    </board>,
  )
  await circuit.renderUntilSettled()
  const shapes = [
    ...(circuit.selectAll("silkscreenoval") as SilkscreenOval[]),
    ...(circuit.selectAll("silkscreenpill") as SilkscreenPill[]),
  ]
  expect(shapes).toHaveLength(30)
  for (const component of shapes) {
    const record =
      "pcb_silkscreen_oval_id" in component
        ? circuit.db.pcb_silkscreen_oval.get(component.pcb_silkscreen_oval_id!)!
        : circuit.db.pcb_silkscreen_pill.get(component.pcb_silkscreen_pill_id!)!
    const path = circuit.db.pcb_silkscreen_path
      .list()
      .find((path) => path.pcb_component_id === record.pcb_component_id)!
    const toLocal = inverse(
      compose(
        translate(record.center.x, record.center.y),
        rotateDEG(record.ccw_rotation ?? 0),
      ),
    )
    for (const point of path.route) {
      const local = applyToPoint(toLocal, point)
      if (record.type === "pcb_silkscreen_oval") {
        expect(
          (local.x / record.radius_x) ** 2 + (local.y / record.radius_y) ** 2,
        ).toBeCloseTo(1, 6)
      } else {
        const radius = Math.min(record.width, record.height) / 2
        const dx = Math.max(0, Math.abs(local.x) - (record.width / 2 - radius))
        const dy = Math.max(0, Math.abs(local.y) - (record.height / 2 - radius))
        expect(Math.hypot(dx, dy)).toBeCloseTo(radius, 6)
      }
    }
    expect(record.layer).toBe(path.layer)
    const xs = path.route.map((point) => point.x)
    const ys = path.route.map((point) => point.y)
    const size = component.getPcbSize()
    expect(
      Math.abs(size.width - (Math.max(...xs) - Math.min(...xs))),
    ).toBeLessThan(0.003)
    expect(
      Math.abs(size.height - (Math.max(...ys) - Math.min(...ys))),
    ).toBeLessThan(0.003)
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
