import { expect, test } from "bun:test"
import { getJlcStackup } from "@tscircuit/jlcpcb-manufacturing-specs"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Found while running `tsci simulate` on a 4-layer pcb_spice DDR channel: the
// pipeline failed with "Board pcb_board_0 has no pcb_stackup. Set
// fabricatorPreset (e.g. "jlcpcb_standard")..." even though the board already
// set fabricatorPreset="jlcpcb_standard".
//
// Cause: the default board thickness is 1.4mm and the JLC stackup templates
// have no 1.4mm entry, so Board_doInitialPcbStackupRender silently inserts
// nothing. No error or warning tells the user why.
const renderBoard = async (thickness?: number) => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={10}
      height={10}
      layers={4}
      thickness={thickness}
      fabricatorPreset="jlcpcb_standard"
      routingDisabled
    >
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )
  await circuit.renderUntilSettled()
  return circuit
}

test("repro: jlcpcb_standard preset with the default board thickness emits no pcb_stackup", async () => {
  expect(
    getJlcStackup({ num_layers: 4, thickness: 1.4, material: "fr4" }),
  ).toBeUndefined()

  const defaultThickness = await renderBoard()
  expect(defaultThickness.db.pcb_board.list()[0].thickness).toBe(1.4)
  // Expected: a pcb_stackup, or an error/warning explaining that 1.4mm has
  // no JLC template. Actual: nothing at all.
  expect(defaultThickness.db.pcb_stackup.list()).toHaveLength(0)
  expect(
    defaultThickness
      .getCircuitJson()
      .filter(
        (element) =>
          (element.type.includes("error") ||
            element.type.includes("warning")) &&
          JSON.stringify(element).toLowerCase().includes("stackup"),
      ),
  ).toHaveLength(0)

  // An explicit thickness that has a JLC template works.
  const explicitThickness = await renderBoard(1.6)
  expect(explicitThickness.db.pcb_stackup.list()).toHaveLength(1)
})
