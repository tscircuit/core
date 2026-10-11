import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("supported routing and intentionally unrouted previews have no legacy configuration errors", async () => {
  for (const routingDisabled of [false, true]) {
    const { circuit } = getTestFixture()
    circuit.add(
      <board
        width="10mm"
        height="8mm"
        autorouter="auto_local"
        routingDisabled={routingDisabled}
      >
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={2} />
        <trace from=".R1 > .pin1" to=".R2 > .pin1" />
        <pcbnotetext text="Supported local router" fontSize={0.4} pcbY={-3} />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(
      circuit.db.source_invalid_component_property_error.list(),
    ).toHaveLength(0)
    expect(circuit.db.source_property_ignored_warning.list()).toHaveLength(0)
    expect(circuit.db.pcb_trace.list()).toHaveLength(routingDisabled ? 0 : 1)
    if (!routingDisabled)
      await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  }
})
