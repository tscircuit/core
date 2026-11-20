import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// An autorouted panel trace from B1's R1 to B2's R2 must cross the tab
// between the boards. The tab's mouse-bite drills leave no legal gap for the
// trace, so the autorouter's best route leaves the tab and crosses the
// routing slot (cutout) instead.
test("autorouted panel trace crosses a mouse-bite tab between two boards", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <panel layoutMode="grid" col={2} panelizationMethod="tab-routing">
      <board name="B1" width={6} height={6}>
        <resistor name="R1" resistance="1k" footprint="0805" />
      </board>
      <board name="B2" width={6} height={6}>
        <resistor name="R2" resistance="1k" footprint="0805" />
      </board>
      <trace from=".B1 .R1 .pin2" to=".B2 .R2 .pin1" />
    </panel>,
  )
  await circuit.renderUntilSettled()

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(
    [
      ...circuit.db.pcb_autorouting_error.list(),
      ...circuit.db.pcb_trace_error.list(),
      ...circuit.db.pcb_placement_error.list(),
    ].map((error) => error.message),
  ).toMatchInlineSnapshot(`[]`)
})
