import { test, expect } from "bun:test"
import { getTestFixture } from "../fixtures/get-test-fixture"

/**
 * Ensure autorouting fails when PCB pads overlap
 */
test("autorouting aborts on overlapping pads", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="10mm"
      height="10mm"
      autorouter={{
        local: true,
        groupMode: "subcircuit",
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
      {/* Overlapping resistor */}
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
      <trace from=".R1 > .pin1" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled().catch(() => {})

  const errors = circuit.db.pcb_autorouting_error.list()
  expect(errors.length).toBeGreaterThan(0)
  expect(errors[0].message).toContain("pads overlap")
})
