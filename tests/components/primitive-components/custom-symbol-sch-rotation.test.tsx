import { expect, test } from "bun:test"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { BSS123LT1G } from "tests/repros/assets/nema34-vbus-lv/bss123lt1g"

test("schRotation rotates custom MOSFET artwork, terminals and connected nets", async () => {
  const { circuit } = getTestFixture({ platform: { pcbDisabled: true } })
  const rotations = [0, 90, 180, 270, -90, 450]

  circuit.add(
    <board>
      <group schX={2} schY={3}>
        {rotations.map((rotation, i) => (
          <Fragment key={rotation}>
            <net name={`GATE_${i + 1}`} isPowerNet={false} />
            <net name={`DRAIN_${i + 1}`} isPowerNet={false} />
            <net name={`SOURCE_${i + 1}`} isPowerNet={false} />
            <BSS123LT1G
              name={`Q${i + 1}`}
              schX={(i % 3) * 7}
              schY={-Math.floor(i / 3) * 7}
              schRotation={rotation}
              connections={{
                gate: `net.GATE_${i + 1}`,
                drain: `net.DRAIN_${i + 1}`,
                source: `net.SOURCE_${i + 1}`,
              }}
            />
            <schematictext
              schX={(i % 3) * 7}
              schY={-Math.floor(i / 3) * 7 - 3}
              text={`schRotation = ${rotation} deg`}
              fontSize={0.26}
            />
          </Fragment>
        ))}
      </group>
    </board>,
  )
  await circuit.renderUntilSettled()

  // Literal offsets from the MOSFET's placement origin in schematic world mm
  // (+X right, +Y up, right-handed), for gate, source and drain respectively.
  const expectedPorts = [
    [
      { x: -1.27, y: 0, facing: "left", side: "left" },
      { x: 0.635, y: -1.27, facing: "down", side: "bottom" },
      { x: 0.635, y: 1.27, facing: "up", side: "top" },
    ],
    [
      { x: 0, y: -1.27, facing: "down", side: "bottom" },
      { x: 1.27, y: 0.635, facing: "right", side: "right" },
      { x: -1.27, y: 0.635, facing: "left", side: "left" },
    ],
    [
      { x: 1.27, y: 0, facing: "right", side: "right" },
      { x: -0.635, y: 1.27, facing: "up", side: "top" },
      { x: -0.635, y: -1.27, facing: "down", side: "bottom" },
    ],
    [
      { x: 0, y: 1.27, facing: "up", side: "top" },
      { x: -1.27, y: -0.635, facing: "left", side: "left" },
      { x: 1.27, y: -0.635, facing: "right", side: "right" },
    ],
  ] as const
  const quarterTurns = [0, 1, 2, 3, 3, 1]

  for (const [i, quarterTurn] of quarterTurns.entries()) {
    const source = circuit.db.source_component.getWhere({ name: `Q${i + 1}` })!
    const component = circuit.db.schematic_component.getWhere({
      source_component_id: source.source_component_id,
    })!
    const filter = { schematic_component_id: component.schematic_component_id }
    const stems = circuit.db.schematic_line.list(filter)
    const paths = circuit.db.schematic_path.list(filter)
    const origin = { x: 2 + (i % 3) * 7, y: 3 - Math.floor(i / 3) * 7 }

    for (const [pinIndex, expected] of expectedPorts[quarterTurn]!.entries()) {
      const port = circuit.db.schematic_port.getWhere({
        ...filter,
        pin_number: pinIndex + 1,
      })!
      expect(port.center.x - origin.x).toBeCloseTo(expected.x)
      expect(port.center.y - origin.y).toBeCloseTo(expected.y)
      expect(port).toMatchObject({
        facing_direction: expected.facing,
        side_of_component: expected.side,
        is_connected: true,
      })
      const stem = stems.find(
        (line) => line.x1 === port.center.x && line.y1 === port.center.y,
      )!
      expect(Math.hypot(stem.x2 - stem.x1, stem.y2 - stem.y1)).toBeCloseTo(
        0.635,
      )
      expect(port.distance_from_component_edge).toBeCloseTo(0.635)
      // Every terminal's stem still meets a point on the emitted MOSFET body.
      const bodyPoints = paths.flatMap((path) => path.points)
      expect(
        bodyPoints.some(
          (point) => Math.hypot(point.x - stem.x2, point.y - stem.y2) < 1e-6,
        ),
      ).toBe(true)
    }
  }

  expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    grid: false,
    width: 1600,
    height: 1000,
  })
})
