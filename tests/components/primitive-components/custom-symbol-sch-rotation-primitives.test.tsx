import { expect, test } from "bun:test"
import type { SymbolProps } from "@tscircuit/props"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom symbol rotation preserves primitive geometry after fill and contain sizing", () => {
  const { circuit } = getTestFixture()
  const symbolViewbox: SymbolProps = {
    viewbox: { minX: -1, maxX: 1, minY: -0.5, maxY: 0.5 },
  }
  const variants = [
    { name: "Unscaled", sx: 1, sy: 1, symbolProps: {} },
    {
      name: "Fill",
      sx: 2,
      sy: 1,
      symbolProps: { width: 4, height: 1, fit: "fill" as const },
    },
    {
      name: "Contain",
      sx: 1,
      sy: 1,
      symbolProps: { width: 4, height: 1, fit: "contain" as const },
    },
  ]
  const rotations = [0, 90, 180, 270]

  circuit.add(
    <board width={30} height={30} routingDisabled>
      {variants.map(({ name, symbolProps }, row) =>
        rotations.map((rotation, column) => (
          <chip
            key={`${name}${rotation}`}
            name={`${name}${rotation}`}
            schX={2 + column * 4}
            schY={3 - row * 4}
            schRotation={rotation}
            symbol={
              <symbol {...symbolViewbox} {...symbolProps}>
                <schematicrect
                  width={1}
                  height={0.6}
                  rotation={30}
                  strokeWidth={0.03}
                />
                <schematicline
                  x1={0}
                  y1={0}
                  x2={0.4}
                  y2={0.1}
                  strokeWidth={0.03}
                />
                <schematiccircle
                  center={{ x: -0.3, y: 0.1 }}
                  radius={0.1}
                  strokeWidth={0.03}
                />
                <schematicarc
                  center={{ x: 0.25, y: -0.1 }}
                  radius={0.12}
                  startAngleDegrees={10}
                  endAngleDegrees={130}
                  strokeWidth={0.03}
                />
                <schematictext
                  text="A"
                  schX={-0.1}
                  schY={0.15}
                  schRotation={30}
                  fontSize={0.15}
                />
                {/* Explicit facing intentionally differs from the radial direction. */}
                <port name="1" schX={1.2} schY={0} direction="up" />
                <port name="2" schX={-1.2} schY={0} />
              </symbol>
            }
          />
        )),
      )}
      {variants.map(({ name }, row) =>
        rotations.map((rotation, column) => (
          <Fragment key={`${name}${rotation}`}>
            <schematictext
              text={`${name} ${rotation} deg`}
              schX={2 + column * 4}
              schY={1.2 - row * 4}
              fontSize={0.2}
            />
          </Fragment>
        )),
      )}
    </board>,
  )
  circuit.render()

  for (const [row, { name, sx, sy }] of variants.entries()) {
    for (const [column, rotation] of rotations.entries()) {
      const source = circuit.db.source_component.getWhere({
        name: `${name}${rotation}`,
      })!
      const component = circuit.db.schematic_component.getWhere({
        source_component_id: source.source_component_id,
      })!
      const filter = {
        schematic_component_id: component.schematic_component_id,
      }
      const rect = circuit.db.schematic_rect.getWhere(filter)!
      const line = circuit.db.schematic_line.getWhere(filter)!
      const circle = circuit.db.schematic_circle.getWhere(filter)!
      const arc = circuit.db.schematic_arc.getWhere(filter)!
      const text = circuit.db.schematic_text.getWhere(filter)!
      const [explicitPort, inferredPort] =
        circuit.db.schematic_port.list(filter)
      const origin = { x: 2 + column * 4, y: 3 - row * 4 }
      // Expected offsets are literal quarter-turn coordinates, independent of
      // the implementation's transformation matrix.
      const circleOffsets = [
        [-0.3 * sx, 0.1 * sy],
        [-0.1 * sy, -0.3 * sx],
        [0.3 * sx, -0.1 * sy],
        [0.1 * sy, 0.3 * sx],
      ]
      const lineOffsets = [
        [0.4 * sx, 0.1 * sy],
        [-0.1 * sy, 0.4 * sx],
        [-0.4 * sx, -0.1 * sy],
        [0.1 * sy, -0.4 * sx],
      ]
      const arcOffsets = [
        [0.25 * sx, -0.1 * sy],
        [0.1 * sy, 0.25 * sx],
        [-0.25 * sx, 0.1 * sy],
        [-0.1 * sy, -0.25 * sx],
      ]
      const textOffsets = [
        [-0.1 * sx, 0.15 * sy],
        [-0.15 * sy, -0.1 * sx],
        [0.1 * sx, -0.15 * sy],
        [0.15 * sy, 0.1 * sx],
      ]

      expect(rect.center.x).toBeCloseTo(origin.x)
      expect(rect.center.y).toBeCloseTo(origin.y)
      expect(rect.width).toBeCloseTo(sx)
      expect(rect.height).toBeCloseTo(0.6 * sy)
      expect(((rect.rotation! % 360) + 360) % 360).toBeCloseTo(rotation + 30)
      expect(line.x1).toBeCloseTo(origin.x)
      expect(line.y1).toBeCloseTo(origin.y)
      expect(line.x2 - origin.x).toBeCloseTo(lineOffsets[column]![0]!)
      expect(line.y2 - origin.y).toBeCloseTo(lineOffsets[column]![1]!)
      expect(circle.center.x - origin.x).toBeCloseTo(circleOffsets[column]![0]!)
      expect(circle.center.y - origin.y).toBeCloseTo(circleOffsets[column]![1]!)
      expect(circle.radius).toBeCloseTo(0.1 * sx)
      expect(arc.center.x - origin.x).toBeCloseTo(arcOffsets[column]![0]!)
      expect(arc.center.y - origin.y).toBeCloseTo(arcOffsets[column]![1]!)
      expect(arc.radius).toBeCloseTo(0.12 * sx)
      expect(((arc.start_angle_degrees % 360) + 360) % 360).toBeCloseTo(
        rotation + 10,
      )
      expect(((arc.end_angle_degrees % 360) + 360) % 360).toBeCloseTo(
        (rotation + 130) % 360,
      )
      expect(text.position.x - origin.x).toBeCloseTo(textOffsets[column]![0]!)
      expect(text.position.y - origin.y).toBeCloseTo(textOffsets[column]![1]!)
      expect(((text.rotation! % 360) + 360) % 360).toBeCloseTo(rotation + 30)
      expect(explicitPort!.facing_direction).toBe(
        (["up", "left", "down", "right"] as const)[column],
      )
      expect(inferredPort!.facing_direction).toBe(
        (["left", "down", "right", "up"] as const)[column],
      )
    }
  }

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
