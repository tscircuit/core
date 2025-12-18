import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const BOARD_SIZE = "10mm"

test("emit solver:started event for Copper Pour pipeline execution", async () => {
  const { circuit } = getTestFixture()

  let copperPourEvent = false
  circuit.on("solver:started", (data) => {
    copperPourEvent = true
  })

  circuit.add(
    <board width={BOARD_SIZE} height={BOARD_SIZE}>
      <copperpour connectsTo="net.GND" layer="top" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(copperPourEvent).toBe(true)
})
