import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("undefined autorouter inherits the platform setting while explicit overrides win", async () => {
  for (const mode of ["omitted", "undefined", "override"] as const) {
    const { circuit } = getTestFixture({
      platform: { autorouter: "sequential_trace" },
    })
    const routerProps =
      mode === "omitted"
        ? {}
        : {
            autorouter:
              mode === "override" ? ("auto_local" as const) : undefined,
          }
    circuit.add(
      <board width={10} height={8} {...routerProps}>
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} />
        <trace from="R1.1" to="R2.1" />
        <pcbnotetext
          text="Undefined inherits disabled platform router"
          fontSize={0.3}
          pcbY={-3}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.pcb_trace.list()).toHaveLength(
      mode === "override" ? 1 : 0,
    )
    expect(
      circuit.db.source_invalid_component_property_error.list(),
    ).toHaveLength(mode === "override" ? 0 : 1)
    if (mode === "undefined")
      await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  }
})
