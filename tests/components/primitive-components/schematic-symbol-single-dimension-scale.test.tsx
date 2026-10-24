import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("SchematicSymbol preserves aspect ratio when only width or height is specified (#4698)", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="30mm" routingDisabled>
      {/* Symbol with width only - should scale Y proportionally to preserve aspect ratio */}
      <chip
        name="U1"
        schX={-5}
        schY={0}
        symbol={
          <symbol width={2}>
            <schematicline x1={-0.5} y1={-0.5} x2={0.5} y2={-0.5} />
            <schematicline x1={0.5} y1={-0.5} x2={0.5} y2={0.5} />
            <schematicline x1={0.5} y1={0.5} x2={-0.5} y2={0.5} />
            <schematicline x1={-0.5} y1={0.5} x2={-0.5} y2={-0.5} />
          </symbol>
        }
      />

      {/* Symbol with height only - should scale X proportionally to preserve aspect ratio */}
      <chip
        name="U2"
        schX={5}
        schY={0}
        symbol={
          <symbol height={2}>
            <schematicline x1={-0.5} y1={-0.5} x2={0.5} y2={-0.5} />
            <schematicline x1={0.5} y1={-0.5} x2={0.5} y2={0.5} />
            <schematicline x1={0.5} y1={0.5} x2={-0.5} y2={0.5} />
            <schematicline x1={-0.5} y1={0.5} x2={-0.5} y2={-0.5} />
          </symbol>
        }
      />
    </board>,
  )

  circuit.render()

  const symbols = circuit.db.schematic_component.list()
  expect(symbols.length).toBe(2)
})
