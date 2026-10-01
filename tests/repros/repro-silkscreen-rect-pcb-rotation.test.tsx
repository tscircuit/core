import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"

test.failing(
  "silkscreenrect pcbRotation should align its outline with rotated corner pads",
  () => {
    const { circuit } = getTestFixture()
    const angles = [0, 90, 180, 270, 30]
    // Footprint-local corner points in mm: +X right, +Y up. These points rotate
    // locally, then inherit the same chip placement/layer flip as the rectangle.
    const corners = [
      { x: -3, y: -1 },
      { x: 3, y: -1 },
      { x: 3, y: 1 },
      { x: -3, y: 1 },
    ]

    circuit.add(
      <board width={62} height={27}>
        <pcbnotetext
          pcbY={11.5}
          fontSize={0.7}
          text="BUG: rectangle outline should join all four corner pads"
        />
        {(["top", "bottom"] as const).flatMap((layer, row) =>
          angles.map((angle, column) => {
            // Spread the requested prop so this repro compiles against the current
            // props package, which does not yet expose pcbRotation on rectangles.
            const rectangleProps = { width: 6, height: 2, pcbRotation: angle }
            return (
              <chip
                key={`${layer}_${angle}`}
                name={`U_${layer}_${angle}`}
                pcbX={-24 + column * 12}
                pcbY={row === 0 ? 5 : -7}
                layer={layer}
                footprint={
                  <footprint>
                    <silkscreenrect {...rectangleProps} filled={false} />
                    {corners.map((corner, pinIndex) => {
                      const rotatedCorner = applyToPoint(
                        rotateDEG(angle),
                        corner,
                      )
                      return (
                        <Fragment key={pinIndex}>
                          <smtpad
                            portHints={[String(pinIndex + 1)]}
                            shape="circle"
                            radius={0.2}
                            pcbX={rotatedCorner.x}
                            pcbY={rotatedCorner.y}
                          />
                        </Fragment>
                      )
                    })}
                  </footprint>
                }
              />
            )
          }),
        )}
        {(["top", "bottom"] as const).flatMap((layer, row) =>
          angles.map((angle, column) => (
            <Fragment key={`label_${layer}_${angle}`}>
              <pcbnotetext
                pcbX={-24 + column * 12}
                pcbY={row === 0 ? 9 : -3}
                fontSize={0.65}
                text={`${layer}: ${angle} deg`}
              />
            </Fragment>
          )),
        )}
      </board>,
    )
    circuit.render()

    // This snapshot documents the current bug. After fixing rotation, update the
    // snapshot and remove test.failing so the geometric assertion remains active.
    expect(circuit).toMatchPcbSnapshot(import.meta.path)

    const rectangles = circuit.db.pcb_silkscreen_rect.list()
    const cornerPads = circuit.db.pcb_smtpad
      .list()
      .filter((pad) => pad.shape === "circle")
    expect(rectangles).toHaveLength(10)
    expect(cornerPads).toHaveLength(40)

    // Compare board-space corner points in mm (+X right, +Y up), independent of
    // whether Core encodes a quarter-turn as ccw_rotation or swapped dimensions.
    const sortedCorners = (points: { x: number; y: number }[]) =>
      points
        .map(({ x, y }) => ({
          x: Math.round(x * 1e6) / 1e6,
          y: Math.round(y * 1e6) / 1e6,
        }))
        .sort((a, b) => a.x - b.x || a.y - b.y)
    const actualCorners = rectangles.map((rect) => {
      const transform = compose(
        translate(rect.center.x, rect.center.y),
        rotateDEG(rect.ccw_rotation ?? 0),
      )
      return sortedCorners(
        [
          { x: -rect.width / 2, y: -rect.height / 2 },
          { x: rect.width / 2, y: -rect.height / 2 },
          { x: rect.width / 2, y: rect.height / 2 },
          { x: -rect.width / 2, y: rect.height / 2 },
        ].map((point) => applyToPoint(transform, point)),
      )
    })
    const expectedCorners = rectangles.map((rect) =>
      sortedCorners(
        cornerPads.filter(
          (pad) => pad.pcb_component_id === rect.pcb_component_id,
        ),
      ),
    )

    // Desired behavior: every non-square rectangle follows the requested rotation.
    // Currently quarter-turns work via swapped dimensions, but the 30-degree
    // outlines stay horizontal instead of following their corner pads.
    expect(actualCorners).toEqual(expectedCorners)
  },
)
