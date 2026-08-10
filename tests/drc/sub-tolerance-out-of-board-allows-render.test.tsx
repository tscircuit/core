import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// A component that overhangs the board edge by a fraction of a millimeter is
// placement noise, not a real design mistake. It must not raise an
// "extends outside board boundaries" error or skip autorouting.
test("sub-tolerance board overhang does not block render or autorouting", async () => {
  const { circuit } = getTestFixture()
  let autoroutingStartCount = 0
  circuit.on("autorouting:start", () => {
    autoroutingStartCount++
  })

  circuit.add(
    <board
      width={10}
      height={6}
      autorouter={{ local: true, groupMode: "subcircuit" }}
    >
      {/* R1 bounding box extends ~0.15mm past the right edge (x = 5). */}
      <resistor
        resistance="1k"
        footprint="0402"
        name="R1"
        pcbX={4.37}
        pcbY={0}
      />
      <resistor resistance="1k" footprint="0402" name="R2" pcbX={0} pcbY={0} />
      <trace from=".R1 > .pin1" to=".R2 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const outOfBoardErrors = circuit
    .getCircuitJson()
    .filter((element) => element.type === "pcb_component_outside_board_error")
  expect(outOfBoardErrors).toHaveLength(0)

  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(autoroutingStartCount).toBe(1)
})
