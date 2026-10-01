import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("disposing a Board cancels awaiting noncooperative fabricator checks and suppresses late failures", async () => {
  const entered = Promise.withResolvers<void>()
  const fabrication = Promise.withResolvers<AnyCircuitElement[]>()
  const { circuit } = getTestFixture({
    platform: {
      schematicDisabled: true,
      fabricatorEngine: {
        runDrcChecks: () => {
          entered.resolve()
          return fabrication.promise
        },
      },
    },
  })
  circuit.add(
    <board
      width={10}
      height={10}
      routingDisabled
      fabricatorPreset="jlcpcb_economy"
    />,
  )
  const settlement = circuit.renderUntilSettled().catch((cause) => cause)
  await entered.promise
  const board = circuit.firstChild!
  await circuit.dispose()
  await settlement
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  fabrication.reject(new Error("fabricator late failure"))
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect(circuit.db.source_runtime_error.list()).toHaveLength(0)
  expect(board).toMatchObject({
    _drcChecksInProgress: false,
    _drcChecksComplete: false,
  })
})
