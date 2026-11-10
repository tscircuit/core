import { expect, test } from "bun:test"
import type { AutoroutingEndEvent, AutoroutingProgressEvent } from "lib/events"
import {
  createRouteEffortAutorouter,
  routeEffort,
} from "tests/fixtures/createRouteEffortAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routing progress and completion carry effort, including completion without progress", async () => {
  for (const emitProgress of [true, false]) {
    const { circuit } = getTestFixture()
    const progress: AutoroutingProgressEvent[] = []
    const ends: AutoroutingEndEvent[] = []
    circuit.on("autorouting:progress", (event) => progress.push(event))
    circuit.on("autorouting:end", (event) => ends.push(event))
    circuit.add(
      <board
        width={20}
        height={10}
        autorouter={{
          algorithmFn: createRouteEffortAutorouter({ emitProgress }),
        }}
      >
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
        <trace from="R1.1" to="R2.1" />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(progress.map((event) => event.routeEffort)).toEqual(
      emitProgress ? [routeEffort] : [],
    )
    expect(ends.map((event) => event.routeEffort)).toEqual([routeEffort])
    expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  }
})
