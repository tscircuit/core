import { expect, test } from "bun:test"
import type { AutoroutingEndEvent } from "lib/events"
import type { FanoutTracePath } from "lib/index"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saved routes round-trip through an internal pin connection", async () => {
  const board = (pcbTracePaths?: FanoutTracePath[]) => (
    <board width={20} height={12} routeRemaining={false} schematicDisabled>
      <net name="SIGNAL" routingPhaseIndex={0} />
      <chip
        name="U1"
        footprint="soic8"
        pinLabels={{ pin1: "IN", pin8: "OUT" }}
        internallyConnectedPins={[["IN", "OUT"]]}
      />
      <testpoint name="A" footprintVariant="pad" pcbX={-7} />
      <testpoint name="B" footprintVariant="pad" pcbX={7} />
      <autoroutingphase phaseIndex={0} pcbTracePaths={pcbTracePaths} />
      <trace from="U1.IN" to="net.SIGNAL" />
      <trace from="U1.OUT" to="net.SIGNAL" />
      <trace from="A.1" to="net.SIGNAL" />
      <trace from="B.1" to="net.SIGNAL" />
      <pcbnotetext
        text="A and B connect through U1's internal pin 1–8 link"
        pcbY={5}
        fontSize={0.4}
      />
    </board>
  )
  const { circuit } = getTestFixture()
  const events: AutoroutingEndEvent[] = []
  circuit.on("autorouting:end", (event) => events.push(event))
  circuit.add(board())
  await circuit.renderUntilSettled()

  expect(events).toHaveLength(1)
  expect(events[0]!.pcbTracePathsUnavailableReason).toBeUndefined()
  const savedPaths = events[0]!.pcbTracePaths
  expect(savedPaths).toHaveLength(2)

  const { circuit: replay } = getTestFixture()
  replay.add(board(savedPaths))
  await replay.renderUntilSettled()
  expect(replay.db.pcb_autorouting_error.list()).toEqual([])
  expect(replay.db.pcb_trace.list().map(({ route }) => route)).toEqual(
    circuit.db.pcb_trace.list().map(({ route }) => route),
  )
  await expect(replay).toMatchPcbSnapshot(import.meta.path)
})
