import { expect, test } from "bun:test"
import {
  createControlledFootprintFetch,
  createFootprintCircuit,
  flushFootprintContinuations,
} from "./helpers"

test("an uncooperative fetch's late response is closed without reading or committing it", async () => {
  const { fetchFootprint, requests } = createControlledFootprintFetch({
    ignoreAbort: true,
  })
  const circuit = createFootprintCircuit({ fetch: fetchFootprint })
  const settled = circuit.renderUntilSettled()
  const resistor = circuit.selectOne("resistor")!
  const childrenBeforeRemoval = resistor.children.length
  resistor.parent!.remove(resistor)
  await settled
  let bodyCancellations = 0
  const response = new Response(
    new ReadableStream({
      cancel() {
        bodyCancellations++
      },
    }),
  )
  requests[0].resolve(response)
  await flushFootprintContinuations()
  expect(bodyCancellations).toBe(1)
  expect(response.bodyUsed).toBe(true)
  expect(resistor.children).toHaveLength(childrenBeforeRemoval)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(0)
  expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)
  expect(circuit.experimentalFootprintLoader!.activeJobCount).toBe(0)
  expect(requests[0].hasAbortListener).toBe(false)
})
