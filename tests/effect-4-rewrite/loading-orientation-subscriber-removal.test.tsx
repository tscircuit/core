import { expect, test } from "bun:test"
import {
  createLoadingCircuit,
  flushLoading,
  loadingDeferred,
  loadingOrientationChip,
  loadingSupplierPads,
} from "./loading-fixture"

test("removing an orientation subscriber preserves the live producer and original callback parameters", async () => {
  const externalResponse = loadingDeferred<Response>()
  const optionsReceived: Array<RequestInit | undefined> = []
  const transport: typeof fetch = Object.assign(
    async (_url: Parameters<typeof fetch>[0], options?: RequestInit) => {
      optionsReceived.push(options)
      return externalResponse.promise
    },
    { preconnect: fetch.preconnect },
  )
  const circuit = createLoadingCircuit({
    platformFetch: transport,
    partsEngine: {
      findPart: () => ({}),
      fetchPartCircuitJson: async ({ platformFetch }) => {
        expect(platformFetch).toBe(transport)
        return (await platformFetch!("https://supplier.test/shared")).json()
      },
    },
  })
  circuit.add(
    <board>
      {loadingOrientationChip("U1")}
      {loadingOrientationChip("U2")}
    </board>,
  )
  const settled = circuit.renderUntilSettled()
  await flushLoading()
  expect(optionsReceived).toEqual([undefined])
  const subscriber = circuit.selectOne(".U2")!
  subscriber.parent!.remove(subscriber)
  externalResponse.resolve(Response.json(loadingSupplierPads))
  await settled
  expect(optionsReceived).toHaveLength(1)
  expect(
    circuit.db.pcb_component.list()[0]?.supplier_pin1_location_map?.jlcpcb,
  ).toBeDefined()
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  await circuit.dispose()
})
