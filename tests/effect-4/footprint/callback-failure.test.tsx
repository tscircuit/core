import { expect, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import { footprintResponse, footprintUrl } from "./helpers"

test("conversion and failure-observer exceptions cannot leak ownership", async () => {
  const circuit = new RootCircuit({
    platform: { routingDisabled: true },
    experimentalFootprintLoading: { fetch: async () => footprintResponse() },
  })
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint="0402" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const conversionFailure = new Error("conversion failed")
  const observerFailure = new Error("failure observer failed")
  const scope = circuit.experimentalFootprintLoader!
  let observedCause: unknown
  const outcome = await scope
    .load(circuit.selectOne("resistor")!, {
      url: footprintUrl,
      isCurrent: () => true,
      decode: async (response) => {
        await response.json()
        return []
      },
      commit: () => {
        throw conversionFailure
      },
      onError: (cause) => {
        observedCause = cause
        throw observerFailure
      },
    })
    .catch((cause: unknown) => cause)
  expect(observedCause).toBe(conversionFailure)
  expect(outcome).toBe(observerFailure)
  expect(scope.activeJobCount).toBe(0)
  await scope.dispose()
})
