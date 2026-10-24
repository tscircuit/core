import { expect, test } from "bun:test"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("early named-net pass retains its later routing phase when reroute is true", async () => {
  const { circuit } = getTestFixture()
  const phaseIo = createAutoroutingPhaseIoStack(circuit)
  const startedPhases: string[] = []
  circuit.on("autorouting:start", (event) => {
    startedPhases.push(event.phaseName!)
  })
  circuit.add(
    <board width={16} height={8} routeRemaining={false}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
      <net name="SIGNAL" routingPhaseIndex={1} />
      <trace from="R1.pin1" to="net.SIGNAL" />
      <trace from="R2.pin1" to="net.SIGNAL" />
      <autoroutingphase
        name="EARLY"
        phaseIndex={0.5}
        connection="net.SIGNAL"
        reroute
        algorithmFn={createBasicAutorouter(async () => [])}
      />
      <autoroutingphase name="LATE" phaseIndex={1} />
      <pcbnotetext
        text="Early net pass preserves later routing"
        pcbY={2.5}
        fontSize={0.6}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(startedPhases).toEqual(["EARLY", "LATE"])
  await expect(phaseIo).toMatchAutoroutingPhaseIoStackSnapshot(
    import.meta.path,
    "named-net-reroute-phase-io",
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
