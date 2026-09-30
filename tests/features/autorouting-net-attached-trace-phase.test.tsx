import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("net-connected traces are routed in their assigned phase", async () => {
  const { circuit } = getTestFixture({
    platform: { schematicDisabled: true },
  })
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)
  const autoroutingPhaseNames: Array<string | undefined> = []
  circuit.on("autorouting:start", ({ phaseName }) => {
    autoroutingPhaseNames.push(phaseName)
  })

  circuit.add(
    <board width="18mm" height="12mm" autorouter="default">
      <testpoint name="TP1" pcbX={-5} pcbY={0} />
      <testpoint name="TP2" pcbX={5} pcbY={0} />
      <net name="SIGNAL" />
      <autoroutingphase phaseIndex={0} name="route-signal" />
      <trace from=".TP1 > .pin1" to="net.SIGNAL" routingPhaseIndex={0} />
      <trace from=".TP2 > .pin1" to="net.SIGNAL" routingPhaseIndex={0} />
      <pcbnotetext text="BOTH TRACES REQUEST PHASE 0" pcbY={4} fontSize={0.8} />
      <pcbnotetext
        text="PHASE 0 ROUTES THE NET CONNECTION"
        pcbY={2.5}
        fontSize={0.65}
        color="#ef4444"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const routedPhase = autoroutingPhaseIoStack[0]?.startSimpleRouteJson
  const sourceNet = circuit.db.source_net.getWhere({ name: "SIGNAL" })
  expect(sourceNet).toBeDefined()
  expect(autoroutingPhaseIoStack).toHaveLength(1)
  expect(routedPhase?.connections).toHaveLength(1)
  expect(routedPhase?.connections[0]?.name).toBe(sourceNet?.source_net_id)
  expect(autoroutingPhaseNames).toEqual(["route-signal"])
  expect(circuit.db.pcb_trace.list()).not.toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
