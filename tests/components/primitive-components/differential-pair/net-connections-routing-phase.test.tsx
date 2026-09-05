import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routes a pin-to-net differential pair in its selected phase", async () => {
  const { circuit } = getTestFixture()
  const phases = createAutoroutingPhaseIoStack(circuit)
  circuit.add(
    <board width={20} height={14} autorouter="auto-local">
      <chip name="U1" footprint="soic8" pcbX={-5} />
      <chip name="U2" footprint="soic8" pcbX={5} />
      <trace from=".U1 > .pin8" to="net.DP" />
      <trace from=".U2 > .pin1" to="net.DP" />
      <trace from=".U1 > .pin7" to="net.DM" />
      <trace from=".U2 > .pin2" to="net.DM" />
      <trace from=".U1 > .pin6" to="net.STATUS" />
      <trace from=".U2 > .pin3" to="net.STATUS" />
      <autoroutingphase
        phaseIndex={0}
        connections={["net.DP", "net.DM"]}
        autorouter="auto-local"
      />
      <autoroutingphase
        phaseIndex={1}
        connections={["net.STATUS"]}
        autorouter="auto-local"
      />
      <differentialpair
        name="USB"
        positiveConnection=".U1 > .pin8"
        negativeConnection=".U1 > .pin7"
        maxLengthSkew={0.1}
      />
      <pcbnotetext
        text="Pin-to-net differential pair: phase 0"
        pcbY={-5}
        fontSize={0.7}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(phases).toHaveLength(2)
  expect(phases[0]?.startSimpleRouteJson?.differentialPairs).toHaveLength(1)
  expect(phases[0]?.startSimpleRouteJson?.connections).toHaveLength(2)
  expect(phases[0]?.endSimpleRouteJson?.traces).toHaveLength(2)
  expect(phases[1]?.startSimpleRouteJson?.connections).toHaveLength(1)
  expect(phases[1]?.startSimpleRouteJson?.differentialPairs).toBeUndefined()
  expect(circuit.db.pcb_trace.list()).toHaveLength(3)
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
