import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("sequential_trace autorouter emits deprecated source_property_ignored_warning", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm" autorouter="sequential-trace">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      <subcircuit name="S1">
        <resistor name="R3" resistance="1k" footprint="0402" />
      </subcircuit>
    </board>,
  )

  circuit.render()

  const warnings = circuit.db.source_property_ignored_warning
    .list()
    .filter((warning) => warning.property_name === "autorouter")

  expect(warnings).toHaveLength(1)
  expect(warnings[0].type).toBe("source_property_ignored_warning")
  expect(warnings[0].error_type).toBe("source_property_ignored_warning")
  expect(warnings[0].message).toContain("sequential_trace")
  expect(warnings[0].message).toContain("deprecated")

  const { circuit: circuitWithGroupMode } = getTestFixture()

  circuitWithGroupMode.add(
    <board
      width="20mm"
      height="20mm"
      autorouter={{ local: true, groupMode: "sequential_trace" }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  circuitWithGroupMode.render()

  const groupModeWarnings =
    circuitWithGroupMode.db.source_property_ignored_warning
      .list()
      .filter((warning) => warning.property_name === "autorouter")

  expect(groupModeWarnings).toHaveLength(1)
  expect(groupModeWarnings[0].type).toBe("source_property_ignored_warning")
})
