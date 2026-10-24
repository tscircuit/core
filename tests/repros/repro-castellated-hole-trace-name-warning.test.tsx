import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("traces created by castellated hole connectivity do not warn about a missing name", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      outline={[
        { x: -6, y: -5 },
        { x: 6, y: -5 },
        {
          x: 6,
          y: 0,
          isCastellatedHole: true,
          holeDiameter: "1mm",
          padDiameter: "1.5mm",
          connectsTo: [".U1 > .pin1"],
        },
        { x: 6, y: 5 },
        { x: -6, y: 5 },
        { x: -6, y: 0 },
      ]}
    >
      <chip name="U1" footprint="soic8" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_trace.list()).toHaveLength(1)

  const warnings = circuit.db.source_unnamed_trace_warning.list()

  // The trace is synthesised from the board outline point's connectsTo, so
  // there is no element for the user to have named.
  expect(warnings).toHaveLength(0)
})
