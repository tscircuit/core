import { expect, test } from "bun:test"
import type { AutorouterProp } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("legacy router errors cover object presets and group modes", async () => {
  const configurations: AutorouterProp[] = [
    { preset: "sequential_trace" },
    { preset: "sequential-trace" },
    { preset: "auto_cloud" },
    { preset: "auto-cloud" },
    { groupMode: "sequential_trace" },
    { groupMode: "sequential-trace" },
  ]
  for (const autorouter of configurations) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board width="10mm" height="8mm" autorouter={autorouter}>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} />
        <trace from=".R1 > .pin1" to=".R2 > .pin1" />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_trace.list()).toHaveLength(0)
    expect(circuit.db.source_property_ignored_warning.list()).toHaveLength(0)
    expect(circuit.db.source_invalid_component_property_error.list()).toEqual([
      expect.objectContaining({
        property_name: "autorouter",
        error_type: "source_invalid_component_property_error",
        message: expect.stringContaining("not enabled by this platform"),
      }),
    ])
  }
})
