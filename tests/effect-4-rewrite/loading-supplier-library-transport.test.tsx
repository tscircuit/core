import { expect, test } from "bun:test"
import {
  createLoadingCircuit,
  external0402Footprint,
  flushLoading,
  loadingDeferred,
} from "./loading-fixture"

test("supplier library fallback preserves exact platform callback identity and suppresses late external I/O results", async () => {
  const externalResponse = loadingDeferred<Response>()
  let transportCalls = 0
  const transport: typeof fetch = Object.assign(
    async () => {
      transportCalls++
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
        return (await platformFetch!("https://supplier.test/C123")).json()
      },
    },
  })
  circuit.add(
    <board>
      <chip
        name="U1"
        footprint="jlcpcb:C123"
        supplierPartNumbers={{ jlcpcb: ["C123"] }}
      />
    </board>,
  )
  const settled = circuit.renderUntilSettled()
  expect(transportCalls).toBe(1)
  const chip = circuit.selectOne(".U1")!
  const childrenBefore = chip.children.length
  chip.parent!.remove(chip)
  await settled
  expect(circuit.effectRuntime.activeJobCount).toBe(0)
  // The legacy callback has no signal; its I/O may finish after owned wait exits.
  externalResponse.resolve(Response.json(external0402Footprint))
  await flushLoading()
  expect(chip.children).toHaveLength(childrenBefore)
  expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(0)
  await circuit.dispose()
})
