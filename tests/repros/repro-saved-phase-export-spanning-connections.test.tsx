import { expect, test } from "bun:test"
import type { AutoroutingEndEvent } from "lib/events"
import type { FanoutTracePath } from "lib/index"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("saved routes round-trip copper spanning two connections on the same net", async () => {
  const board = (pcbTracePaths?: FanoutTracePath[]) => (
    <board width={18} height={12} routeRemaining={false} schematicDisabled>
      <testpoint name="A" footprintVariant="pad" pcbX={-5} />
      <testpoint name="B" footprintVariant="pad" pcbX={5} />
      <testpoint name="C" footprintVariant="pad" pcbY={3} />
      <autoroutingphase phaseIndex={0} pcbTracePaths={pcbTracePaths} />
      <trace from="A.1" to="B.1" routingPhaseIndex={0} />
      <trace from="B.1" to="C.1" routingPhaseIndex={0} />
      <pcbnotetext
        text="Connections A–B and B–C route through pad C"
        pcbY={5}
        fontSize={0.4}
      />
    </board>
  )
  const { circuit } = getTestFixture()
  const routingEvents: AutoroutingEndEvent[] = []
  circuit.on("autorouting:end", (event) => routingEvents.push(event))
  circuit.add(board())
  await circuit.renderUntilSettled()

  expect(routingEvents).toHaveLength(1)
  const savedPaths = routingEvents[0]?.pcbTracePaths
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
