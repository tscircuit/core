import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A 1 x 1 square with a port and stem sticking 0.5 out on the right: without a viewbox the measured bounds include
// the stem, so width={2} draws the square narrower than 2
const Square = (props: {
  viewbox?: { x: number; y: number; width: number; height: number }
}) => (
  <symbol width={2} height={2} objectFit="contain" viewbox={props.viewbox}>
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

test("symbol viewbox is the region fitted into width / height", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="20mm" height="20mm" routingDisabled>
      <chip name="MEASURED" schX={0} schY={0} symbol={<Square />} />
      <chip
        name="VIEWBOX"
        schX={0}
        schY={5}
        symbol={<Square viewbox={{ x: -0.5, y: -0.5, width: 1, height: 1 }} />}
      />
    </board>,
  )
  circuit.render()

  const square = (name: string) => {
    const src = circuit.db.source_component.getWhere({ name })!
    const comp = circuit.db.schematic_component.getWhere({
      source_component_id: src.source_component_id,
    })!
    const lines = circuit.db.schematic_line
      .list()
      .filter(
        (l) =>
          l.schematic_component_id === comp.schematic_component_id &&
          l.stroke_width !== 0.02,
      )
    const port = circuit.db.schematic_port
      .list()
      .find((p) => p.schematic_component_id === comp.schematic_component_id)!
    const xs = lines.flatMap((l) => [l.x1, l.x2])
    return {
      w: Math.max(...xs) - Math.min(...xs),
      cx: (Math.max(...xs) + Math.min(...xs)) / 2,
      port: port.center.x,
    }
  }

  // measured bounds (square, stem and port) are fitted to 2: the square itself comes out narrower than 2
  expect(square("MEASURED").w).toBeLessThan(1.5)
  // the viewbox names the square itself: it comes out exactly 2 wide, centred on the component, port 1 beyond it
  const v = square("VIEWBOX")
  expect(v.w).toBeCloseTo(2, 6)
  expect(v.cx).toBeCloseTo(0, 6)
  expect(v.port - v.cx).toBeCloseTo(2, 6)
})
