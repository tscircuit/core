import { expect, test } from "bun:test"
import type { AutoroutingErrorEvent } from "lib/events"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("failed routing preserves declared phase identity and execution order", async () => {
  const { circuit } = getTestFixture()
  const errors: AutoroutingErrorEvent[] = []
  circuit.on("autorouting:error", (event) => errors.push(event))
  circuit.add(
    <board width={20} height={10}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
      <autoroutingphase
        phaseIndex={13}
        algorithmFn={createBasicAutorouter(async () => {
          throw new Error("test routing failure")
        })}
      />
      <trace from="R1.1" to="R2.1" routingPhaseIndex={13} />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(errors).toHaveLength(1)
  expect(errors[0]).toMatchObject({
    routingPhaseIndex: 13,
    _actualRoutingPhaseOrderIndex: 0,
    error: { message: "test routing failure" },
  })
})
