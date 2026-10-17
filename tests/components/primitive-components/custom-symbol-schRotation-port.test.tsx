import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const Arrow = () => (
  <symbol>
    <schematicpath
      points={[
        { x: -0.5, y: -0.3 },
        { x: 0.3, y: -0.3 },
        { x: 0.5, y: 0 },
        { x: 0.3, y: 0.3 },
        { x: -0.5, y: 0.3 },
        { x: -0.5, y: -0.3 },
      ]}
      strokeWidth={0.05}
    />
    <port name="1" direction="right" schX={0.5} schY={0} />
  </symbol>
)

test("schRotation turns a custom symbol's port counter-clockwise", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      {[0, 90, 180, 270].map((r, i) => (
        <chip
          key={r}
          name={`S${r}`}
          symbol={<Arrow />}
          schX={i * 2}
          schY={0}
          schRotation={r}
        />
      ))}
    </board>,
  )
  circuit.render()

  const expected: Record<number, [number, number, string, string]> = {
    0: [0.5, 0, "right", "right"],
    90: [0, 0.5, "up", "top"],
    180: [-0.5, 0, "left", "left"],
    270: [0, -0.5, "down", "bottom"],
  }
  for (const [r, [dx, dy, facing, side]] of Object.entries(expected)) {
    const i = [0, 90, 180, 270].indexOf(Number(r))
    const source = circuit.db.source_component.getWhere({ name: `S${r}` })!
    const comp = circuit.db.schematic_component.getWhere({
      source_component_id: source.source_component_id,
    })!
    const [port] = circuit.db.schematic_port
      .list()
      .filter((p) => p.schematic_component_id === comp.schematic_component_id)
    expect(port.center.x).toBeCloseTo(i * 2 + dx, 6)
    expect(port.center.y).toBeCloseTo(dy, 6)
    expect(port.facing_direction).toBe(facing as any)
    expect(port.side_of_component).toBe(side as any)
  }
})
