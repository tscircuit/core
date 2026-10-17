import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routing that finishes after the labels are placed doesn't place them again", async () => {
  const { circuit } = getTestFixture()
  let solverStartedCount = 0
  circuit.on("solver:started", (event) => {
    if (event.solverName === "SilkscreenLabelPlacementSolver")
      solverStartedCount++
  })

  circuit.add(
    <board width="12mm" height="12mm">
      {/* No spot near R1 is clear, so its label keeps an issue */}
      <silkscreenrect pcbX={0} pcbY={2} width={11} height={7} filled />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={0} pcbY={2} />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={-3}
        pcbY={-4.5}
      />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0402"
        pcbX={3}
        pcbY={-4.5}
      />
      <trace from=".R2 > .pin2" to=".R3 > .pin1" />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(solverStartedCount).toBe(1)
})
