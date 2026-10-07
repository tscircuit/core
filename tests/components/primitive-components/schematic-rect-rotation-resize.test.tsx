import { expect, test } from "bun:test"
import { Fragment } from "react"
import {
  applyToPoint,
  compose,
  rotateDEG,
  translate,
} from "transformation-matrix"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotated schematic rectangles resize like equivalent paths", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  const rotations = [0, 90, 180, 270]
  const sizes = [
    { width: 4, height: 4 },
    { width: 6, height: 3 },
    { width: 4 },
    { height: 6 },
  ]
  const scenarios = sizes.flatMap((size, row) =>
    rotations.map((rotation, column) => ({
      size,
      rotation,
      x: column * 8,
      y: -row * 9,
    })),
  )

  circuit.add(
    <board routingDisabled>
      <schematictext
        schX={12}
        schY={6}
        text="Red rectangle / Blue equivalent path (mm)"
        fontSize={0.6}
      />
      {scenarios.map(({ size, rotation, x, y }, index) => (
        <Fragment key={index}>
          <schematictext
            schX={x}
            schY={y + 4}
            text={`${rotation} deg: ${size.width ?? "auto"} x ${size.height ?? "auto"}`}
            fontSize={0.4}
          />
          <chip
            name={`U${index + 1}`}
            schX={x}
            schY={y}
            symbol={
              <symbol {...size}>
                <schematicrect
                  schX={1}
                  schY={0.5}
                  width={4}
                  height={2}
                  rotation={rotation}
                  color="#cc0000"
                  strokeWidth={0.12}
                />
                <schematicpath
                  points={[
                    { x: -2, y: -1 },
                    { x: 2, y: -1 },
                    { x: 2, y: 1 },
                    { x: -2, y: 1 },
                    { x: -2, y: -1 },
                  ].map((point) =>
                    applyToPoint(
                      compose(translate(1, 0.5), rotateDEG(rotation)),
                      point,
                    ),
                  )}
                  strokeColor="#0066cc"
                  strokeWidth={0.05}
                />
              </symbol>
            }
          />
        </Fragment>
      ))}
    </board>,
  )

  circuit.render()
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    width: 1000,
    height: 1100,
  })

  const rects = circuit.db.schematic_rect.list()
  const paths = circuit.db.schematic_path.list()
  for (const [index, { size, rotation, x, y }] of scenarios.entries()) {
    const rect = rects[index]!
    const path = paths[index]!
    const width =
      Math.max(...path.points.map((p) => p.x)) -
      Math.min(...path.points.map((p) => p.x))
    const height =
      Math.max(...path.points.map((p) => p.y)) -
      Math.min(...path.points.map((p) => p.y))
    const isQuarterTurn = rotation % 180 === 90
    expect(width).toBeCloseTo(size.width ?? (isQuarterTurn ? 2 : 4))
    expect(height).toBeCloseTo(size.height ?? (isQuarterTurn ? 4 : 2))
    expect(rect.width).toBeCloseTo(isQuarterTurn ? height : width)
    expect(rect.height).toBeCloseTo(isQuarterTurn ? width : height)
    expect(rect.center.x).toBeCloseTo(x)
    expect(rect.center.y).toBeCloseTo(y)
    expect(rect.rotation).toBe(rotation)
  }
})
