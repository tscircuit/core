import { expect, test } from "bun:test"
import { ControllableAutorouter } from "tests/fixtures/controllable-autorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { abortableDelay } from "lib/utils/abortable-delay"

test("cancellation stops a router created after its async factory was canceled", async () => {
  const { circuit } = getTestFixture()
  const created = Promise.withResolvers<ControllableAutorouter>()
  const factory = Promise.withResolvers<ControllableAutorouter>()
  const reason = new Error("Canceled pending router factory")
  circuit.add(
    <board
      width={16}
      height={12}
      autorouter={{
        algorithmFn: async (input) => {
          created.resolve(new ControllableAutorouter(input))
          return factory.promise
        },
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} />
      <trace from="R1.pin1" to="R2.pin1" />
    </board>,
  )

  const rendering = circuit.renderUntilSettled()
  const router = await created.promise
  circuit.cancelRendering(reason)
  await expect(rendering).rejects.toBe(reason)
  factory.resolve(router)
  await abortableDelay(0)
  expect(router.startCount).toBe(0)
  expect(router.stopCount).toBe(1)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
})
