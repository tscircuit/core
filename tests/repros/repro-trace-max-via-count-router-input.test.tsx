import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test.failing("trace maxViaCount must reach the Pipeline 9 input", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board width="14mm" height="8mm" layers={2} autorouter="beta-pipeline9">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
      <trace
        name="NO_VIAS"
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        maxViaCount={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const sourceTrace = circuit.db.source_trace.getWhere({ name: "NO_VIAS" })!
  const srjConnection = autoroutingPhaseIoStack
    .flatMap((phase) => phase.startSimpleRouteJson?.connections ?? [])
    .find((connection) => connection.name === sourceTrace.source_trace_id)

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(sourceTrace.max_via_count).toBe(0)
  expect(srjConnection).toBeDefined()

  // This is an input-contract repro, not a geometry/via-count snapshot: the
  // unobstructed route can use zero vias even when the router lost the limit.
  // Inspect the actual autorouting:start event rather than constructing SRJ.
  expect(srjConnection).toHaveProperty("maxViaCount", 0)
})
