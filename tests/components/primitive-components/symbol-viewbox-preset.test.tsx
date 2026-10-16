import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A 1 x 1 square with a port and stem sticking 0.5 out on the right, sized to width 2
const Square = (props: {
  viewboxPreset?: "shape_bounds" | "shape_and_port_bounds"
}) => (
  <symbol width={2} objectFit="contain" viewboxPreset={props.viewboxPreset}>
    <schematicline x1={-0.5} y1={-0.5} x2={0.5} y2={-0.5} />
    <schematicline x1={0.5} y1={-0.5} x2={0.5} y2={0.5} />
    <schematicline x1={0.5} y1={0.5} x2={-0.5} y2={0.5} />
    <schematicline x1={-0.5} y1={0.5} x2={-0.5} y2={-0.5} />
    <port
      name="1"
      pinNumber={1}
      direction="right"
      schX={1}
      schY={0}
      schStemLength={0.5}
    />
  </symbol>
)

test('symbol viewboxPreset="shape_bounds" fits the drawing without its ports', () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip name="UNSET" schX={0} schY={0} symbol={<Square />} />
      <chip
        name="PORTS"
        schX={0}
        schY={4}
        symbol={<Square viewboxPreset="shape_and_port_bounds" />}
      />
      <chip
        name="SHAPES"
        schX={0}
        schY={8}
        symbol={<Square viewboxPreset="shape_bounds" />}
      />
    </board>,
  )
  circuit.render()

  const squareWidth = (name: string) => {
    const src = circuit.db.source_component.getWhere({ name })!
    const comp = circuit.db.schematic_component.getWhere({
      source_component_id: src.source_component_id,
    })!
    const xs = circuit.db.schematic_line
      .list()
      .filter(
        (l) =>
          l.schematic_component_id === comp.schematic_component_id &&
          l.stroke_width !== 0.02,
      )
      .flatMap((l) => [l.x1, l.x2])
    return Math.max(...xs) - Math.min(...xs)
  }

  // the default measures drawing and ports, so the square comes out narrower than 2
  expect(squareWidth("UNSET")).toBeLessThan(1.5)
  expect(squareWidth("PORTS")).toBeCloseTo(squareWidth("UNSET"), 6)
  // shape_bounds measures the drawing alone: the square is exactly 2 wide
  expect(squareWidth("SHAPES")).toBeCloseTo(2, 6)
})
