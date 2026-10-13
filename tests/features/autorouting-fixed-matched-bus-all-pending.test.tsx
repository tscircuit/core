import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { addFixedMatchedBus } from "tests/fixtures/fixed-matched-bus"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("all-pending matched bus members still route together", async () => {
  const { circuit } = getTestFixture()
  const phaseInputs: SimpleRouteJson[] = []
  circuit.on("autorouting:start", (event) =>
    phaseInputs.push(event.simpleRouteJson),
  )
  addFixedMatchedBus(circuit, {
    fixed: false,
    explanation: "Two pending 20 mm members route in one matched group",
  })
  await circuit.renderUntilSettled()
  expect(phaseInputs).toHaveLength(1)
  expect(phaseInputs[0].buses![0].connectionNames).toHaveLength(2)
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(circuit.db.pcb_bus_length_skew_error.list()).toEqual([])
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
