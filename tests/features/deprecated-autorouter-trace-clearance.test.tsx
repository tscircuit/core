import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("warns once for each explicit autorouter.traceClearance", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board autorouter={{ traceClearance: 0 }} minTraceToPadEdgeClearance={0.3}>
      <group subcircuit name="Nested" />
      <autoroutingphase
        phaseIndex={1}
        autorouter={{ traceClearance: "0.4mm" }}
      />
      <autoroutingphase phaseIndex={2} minTraceToPadEdgeClearance={0.5} />
    </board>,
  )
  circuit.render()
  circuit.render()

  const warnings = circuit.db.source_property_ignored_warning.list()
  expect(warnings.map((warning) => warning.property_name)).toEqual([
    "autorouter.traceClearance",
    "autorouter.traceClearance",
  ])
  expect(warnings.map((warning) => warning.message).sort()).toEqual([
    "autorouter.traceClearance on <autoroutingphase> is deprecated. Set minTraceToPadEdgeClearance on <board> or <autoroutingphase> instead.",
    "autorouter.traceClearance on <board> is deprecated. Set minTraceToPadEdgeClearance on <board> or <autoroutingphase> instead.",
  ])
})
