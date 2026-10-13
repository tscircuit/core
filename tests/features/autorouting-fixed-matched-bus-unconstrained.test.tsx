import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { addFixedMatchedBus } from "tests/fixtures/fixed-matched-bus"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an unconstrained bus still routes its pending member", async () => {
  const { circuit } = getTestFixture()
  const phaseInputs: SimpleRouteJson[] = []
  circuit.on("autorouting:start", (event) =>
    phaseInputs.push(event.simpleRouteJson),
  )
  addFixedMatchedBus(circuit, { matched: false })
  await circuit.renderUntilSettled()
  expect(phaseInputs).toHaveLength(1)
  expect(phaseInputs[0].buses![0].connectionNames).toHaveLength(1)
  expect(circuit.db.source_bus.list()[0].source_trace_ids).toHaveLength(2)
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
