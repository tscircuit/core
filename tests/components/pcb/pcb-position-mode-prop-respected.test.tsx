import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Regression: setting `pcbPositionMode` on a chip prop must result in
// the chip's pcb_component being stamped with that position_mode in the
// circuit JSON output. Previously the prop typechecked but had no
// observable effect — `position_mode` was always "relative_to_group_anchor"
// (or "packed" after the auto-placer ran), regardless of what the user
// requested.

test("pcbPositionMode='relative_to_board_anchor' is reflected in pcb_component.position_mode", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={0}
        pcbY={0}
        pcbPositionMode="relative_to_board_anchor"
      />
    </board>,
  )

  circuit.render()

  const pcbComp = circuit.db.pcb_component.list()[0]
  expect(pcbComp).toBeDefined()
  // circuit-json's position_mode union doesn't yet include
  // "relative_to_board_anchor"; props does. Cast for the assertion.
  expect(pcbComp?.position_mode as string).toBe("relative_to_board_anchor")
})

test("pcbPositionMode unset preserves the historical 'relative_to_group_anchor' default", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={0} />
    </board>,
  )

  circuit.render()

  const pcbComp = circuit.db.pcb_component.list()[0]
  expect(pcbComp).toBeDefined()
  // No prop → default mode (may become "packed" after the auto-placer).
  expect(["relative_to_group_anchor", "packed"]).toContain(
    pcbComp?.position_mode as string,
  )
})
