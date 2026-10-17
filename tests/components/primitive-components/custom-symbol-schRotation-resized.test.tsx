import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const Sized = () => (
  <symbol width={2} height={1}>
    <schematicline x1={-0.5} y1={0} x2={0.5} y2={0} strokeWidth={0.05} />
    <schematicline
      x1={-0.5}
      y1={-0.25}
      x2={-0.5}
      y2={0.25}
      strokeWidth={0.05}
    />
    <port name="1" direction="right" schX={0.5} schY={0} />
  </symbol>
)

test("schRotation turns a resized custom symbol after sizing it in its own axes", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip name="A" schX={0} schY={0} symbol={<Sized />} />
      <chip name="B" schX={0} schY={5} schRotation={90} symbol={<Sized />} />
    </board>,
  )
  circuit.render()

  const get = (name: string) => {
    const source = circuit.db.source_component.getWhere({ name })!
    const component = circuit.db.schematic_component.getWhere({
      source_component_id: source.source_component_id,
    })!
    const port = circuit.db.schematic_port
      .list()
      .find(
        (p) => p.schematic_component_id === component.schematic_component_id,
      )!
    return { component, port }
  }
  const a = get("A")
  const b = get("B")

  // Width and height apply along the symbol's own axes, then it turns 90° ccw
  expect(b.component.size.width).toBeCloseTo(a.component.size.height, 6)
  expect(b.component.size.height).toBeCloseTo(a.component.size.width, 6)
  expect(b.port.center.x).toBeCloseTo(0 - a.port.center.y, 6)
  expect(b.port.center.y).toBeCloseTo(5 + a.port.center.x, 6)
  expect(a.port.facing_direction).toBe("right")
  expect(b.port.facing_direction).toBe("up")
})
