import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A panel trace from B1's R1 to B2's R2 must cross the tab between the boards,
// and that tab's mouse-bite drills sit across its path. The drills leave no
// legal gap, so the trace is routed into a drill.
test("panel trace crosses a mouse-bite tab between two boards", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" col={2} panelizationMethod="tab-routing">
      <board name="B1" width={12} height={12}>
        <resistor name="R1" resistance="1k" footprint="0805" />
      </board>
      <board name="B2" width={12} height={12}>
        <resistor name="R2" resistance="1k" footprint="0805" />
      </board>
      <trace from=".B1 .R1 .pin2" to=".B2 .R2 .pin1" />
    </panel>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(
    circuit.db.pcb_trace_error.list().map((error) => error.message),
  ).toMatchInlineSnapshot(`[]`)
})
