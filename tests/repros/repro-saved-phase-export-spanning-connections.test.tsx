import { expect, test } from "bun:test"
import type { AutoroutingEndEvent } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("export omits saved paths spanning two connections on the same net", async () => {
  const { circuit } = getTestFixture()
  const routingEvents: AutoroutingEndEvent[] = []
  circuit.on("autorouting:end", (event) => routingEvents.push(event))

  circuit.add(
    <board width={18} height={12} routeRemaining={false} schematicDisabled>
      <testpoint name="A" footprintVariant="pad" pcbX={-5} />
      <testpoint name="B" footprintVariant="pad" pcbX={5} />
      <testpoint name="C" footprintVariant="pad" pcbY={3} />
      <autoroutingphase phaseIndex={0} />
      <trace from="A.1" to="B.1" routingPhaseIndex={0} />
      <trace from="B.1" to="C.1" routingPhaseIndex={0} />
      <pcbnotetext
        text="Connections A–B and B–C route through pad C"
        pcbY={5}
        fontSize={0.4}
      />
      <pcbnotetext
        text="Copper routed, no saved paths"
        pcbY={-3}
        fontSize={0.5}
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(routingEvents).toHaveLength(1)
  expect(routingEvents[0]?.pcbTracePaths).toBeUndefined()
  expect(routingEvents[0]?.pcbTracePathsUnavailableReason).toContain(
    "must end at another connection endpoint",
  )
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
