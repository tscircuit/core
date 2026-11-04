import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("trace created by connections prop does not emit source_unnamed_trace_warning", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        pcbX={-4}
        pcbY={0}
        connections={{ pin2: ".R2 > .pin1" }}
      />
      <resistor name="R2" resistance="1k" footprint="0603" pcbX={4} pcbY={0} />
    </board>,
  )

  circuit.render()

  expect(circuit.db.source_trace.list()).toHaveLength(1)
  expect(circuit.db.source_unnamed_trace_warning.list()).toHaveLength(0)
})
