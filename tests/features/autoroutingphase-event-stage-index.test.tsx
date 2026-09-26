import { expect, test } from "bun:test"
import type { AutoroutingExecutionMetadata } from "lib/events"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("fanout and follow-up stages retain the declared phase index", async () => {
  const { circuit } = getTestFixture()
  const starts: AutoroutingExecutionMetadata[] = []
  const ends: AutoroutingExecutionMetadata[] = []
  circuit.on("autorouting:start", (event) => starts.push(event))
  circuit.on("autorouting:end", (event) => ends.push(event))
  circuit.add(
    <board width={20} height={10}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
      <autoroutingphase
        name="escape-and-connect"
        phaseIndex={7}
        autorouter="fanout"
      />
      <trace from="R1.1" to="R2.1" routingPhaseIndex={7} />
      <pcbnotetext
        text="Phase 7: fanout then connect (orders 0 and 1)"
        pcbY={3}
        fontSize={0.45}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const events of [starts, ends]) {
    expect(events.map((event) => event.routingPhaseIndex)).toEqual([7, 7])
    expect(events.map((event) => event._actualRoutingPhaseOrderIndex)).toEqual([
      0, 1,
    ])
  }
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
