import { expect, test } from "bun:test"
import type { AutoroutingErrorEvent } from "lib/events"
import {
  createComputeCostAutorouter,
  computeCostSummary,
} from "tests/fixtures/create-compute-cost-autorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routing failure carries computeCostSummary even when no progress was emitted", async () => {
  const { circuit } = getTestFixture()
  const errors: AutoroutingErrorEvent[] = []
  let progressCount = 0
  circuit.on("autorouting:error", (event) => errors.push(event))
  circuit.on("autorouting:progress", () => progressCount++)
  circuit.add(
    <board
      width={20}
      height={10}
      autorouter={{ algorithmFn: createComputeCostAutorouter({ fail: true }) }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
      <trace from="R1.1" to="R2.1" />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(progressCount).toBe(0)
  expect(errors).toHaveLength(1)
  expect(errors[0]).toMatchObject({
    error: { message: "test routing failure" },
    computeCostSummary,
  })
})
