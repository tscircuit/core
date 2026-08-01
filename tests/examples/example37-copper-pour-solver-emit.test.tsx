import { test, expect } from "bun:test"
import type { SolverStartedEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const BOARD_SIZE = "10mm"

test("emit solver:started event for Copper Pour pipeline execution", async () => {
  const { circuit } = getTestFixture()

  let copperPourEvent: SolverStartedEvent | undefined
  circuit.on("solver:started", (data) => {
    if (data.solverName === "CopperPourPipelineSolver") {
      copperPourEvent = data
    }
  })

  circuit.add(
    <board width={BOARD_SIZE} height={BOARD_SIZE}>
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(copperPourEvent?.solverConstructorArgs).toEqual([
    copperPourEvent?.solverParams,
  ])
})
