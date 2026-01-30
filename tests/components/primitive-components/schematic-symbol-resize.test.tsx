import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicSymbol resize with all primitive types", () => {
  const { circuit } = getTestFixture()

  // SVG path for a small triangle (0,0 -> 0.5,0.5 -> 0,0.5 -> 0,0)
  const triangleSvgPath = "M 0 0 L 0.5 0.5 L 0 0.5 Z"

  circuit.add(
    <board width="20mm" height="20mm">
      {/* Symbol WITHOUT width/height - should render as-is at schX/schY position */}
      <chip
        name="U1"
        schX={-5}
        schY={3}
        symbol={
          <symbol>
            {/* Box outline */}
            <schematicline x1={0} y1={0} x2={1} y2={0} />
            <schematicline x1={1} y1={0} x2={1} y2={1} />
            <schematicline x1={1} y1={1} x2={0} y2={1} />
            <schematicline x1={0} y1={1} x2={0} y2={0} />
            {/* Inner rect */}
            <schematicrect schX={0.5} schY={0.5} width={0.3} height={0.3} />
            {/* Circle */}
            <schematiccircle center={{ x: 0.25, y: 0.75 }} radius={0.1} />
            {/* Text label */}
            <schematictext schX={0.5} schY={-0.2} text="U1" />
            {/* Path from SVG */}
            <schematicpath svgPath={triangleSvgPath} />
          </symbol>
        }
      />

      {/* Symbol WITH width/height - should scale content to 2x2 */}
      <chip
        name="U2"
        schX={5}
        schY={3}
        symbol={
          <symbol width={2} height={2}>
            {/* Box outline */}
            <schematicline x1={0} y1={0} x2={1} y2={0} />
            <schematicline x1={1} y1={0} x2={1} y2={1} />
            <schematicline x1={1} y1={1} x2={0} y2={1} />
            <schematicline x1={0} y1={1} x2={0} y2={0} />
            {/* Inner rect */}
            <schematicrect schX={0.5} schY={0.5} width={0.3} height={0.3} />
            {/* Circle */}
            <schematiccircle center={{ x: 0.25, y: 0.75 }} radius={0.1} />
            {/* Text label */}
            <schematictext schX={0.5} schY={-0.2} text="U2" />
            {/* Path from SVG - should also be scaled */}
            <schematicpath svgPath={triangleSvgPath} />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
