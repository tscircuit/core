import { expect, test } from "bun:test"
import type { AutoroutingEndEvent, AutoroutingProgressEvent } from "lib/events"
import {
  createComputeCostAutorouter,
  computeCost,
} from "tests/fixtures/create-compute-cost-autorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routing progress and completion carry computeCost, including completion without progress", async () => {
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
          algorithmFn: createComputeCostAutorouter({ emitProgress }),
        }}
      >
        <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
        <trace from="R1.1" to="R2.1" />
      </board>,
    )
    await circuit.renderUntilSettled()
    expect(progress.map((event) => event.computeCost)).toEqual(
      emitProgress ? [computeCost] : [],
    )
    expect(ends.map((event) => event.computeCost)).toEqual([computeCost])
    expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  }
})
