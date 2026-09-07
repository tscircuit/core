import { expect, test } from "bun:test"
import type { Group } from "lib/components/primitive-components/Group/Group"
import { ControllableAutorouter } from "tests/fixtures/controllable-autorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { abortableDelay } from "lib/utils/abortable-delay"

test("canceling a phase end event prevents publishing the routing result", async () => {
  const { circuit } = getTestFixture()
  const reason = new Error("Cancel before publishing routing")
  circuit.on("autorouting:end", () => circuit.cancelRendering(reason))
  circuit.add(
    <board
      width={16}
      height={12}
      autorouter={{
        algorithmFn: async (input) => {
          const router = new ControllableAutorouter(input)
          router.onStart = () => router.emit({ type: "complete", traces: [] })
          return router
        },
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />
      <trace from="R1.pin1" to="R2.pin1" />
    </board>,
  )
  await expect(circuit.renderUntilSettled()).rejects.toBe(reason)
  await abortableDelay(0)
  const board = circuit.firstChild as Group
  expect(board._asyncAutoroutingResult).toBeNull()
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
})
