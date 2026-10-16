import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A 1 x 1 square outline; its drawn extent after fitting shows the scale on each axis
const Square = (props: {
  width?: number
  height?: number
  objectFit?: "fill" | "contain"
  name: string
}) => (
  <symbol width={props.width} height={props.height} objectFit={props.objectFit}>
    <schematicline x1={-0.5} y1={-0.5} x2={0.5} y2={-0.5} />
    <schematicline x1={0.5} y1={-0.5} x2={0.5} y2={0.5} />
    <schematicline x1={0.5} y1={0.5} x2={-0.5} y2={0.5} />
    <schematicline x1={-0.5} y1={0.5} x2={-0.5} y2={-0.5} />
  </symbol>
)

test('symbol objectFit="contain" scales both axes by one factor', () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip
        name="FILL"
        schX={0}
        schY={0}
        symbol={<Square name="f" width={2} height={1} />}
      />
      <chip
        name="BOTH"
        schX={0}
        schY={4}
        symbol={<Square name="b" width={2} height={1} objectFit="contain" />}
      />
      <chip
        name="WIDTH"
        schX={0}
        schY={8}
        symbol={<Square name="w" width={2} objectFit="contain" />}
      />
    </board>,
  )
  circuit.render()

  const extent = (name: string) => {
    const src = circuit.db.source_component.getWhere({ name })!
    const comp = circuit.db.schematic_component.getWhere({
      source_component_id: src.source_component_id,
    })!
    const lines = circuit.db.schematic_line
      .list()
      .filter((l) => l.schematic_component_id === comp.schematic_component_id)
    const xs = lines.flatMap((l) => [l.x1, l.x2])
    const ys = lines.flatMap((l) => [l.y1, l.y2])
    return {
      w: Math.max(...xs) - Math.min(...xs),
      h: Math.max(...ys) - Math.min(...ys),
    }
  }

  // "fill" (and unset) stretches each axis separately: the square becomes 2 x 1
  expect(extent("FILL").w).toBeCloseTo(2, 6)
  expect(extent("FILL").h).toBeCloseTo(1, 6)
  // "contain" keeps it square, at the largest size that fits 2 x 1
  expect(extent("BOTH").w).toBeCloseTo(1, 6)
  expect(extent("BOTH").h).toBeCloseTo(1, 6)
  // with only width given, width sets the one factor for both axes
  expect(extent("WIDTH").w).toBeCloseTo(2, 6)
  expect(extent("WIDTH").h).toBeCloseTo(2, 6)
})
