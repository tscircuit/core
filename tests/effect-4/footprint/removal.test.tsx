import { expect, test } from "bun:test"
import {
  createControlledFootprintFetch,
  createFootprintCircuit,
} from "./helpers"

test("removal aborts the owned request, releases resources and settles the async record", async () => {
  const { fetchFootprint, requests } = createControlledFootprintFetch()
  const circuit = createFootprintCircuit({
    fetch: fetchFootprint,
    maxRetries: 2,
  })
  const errors: unknown[] = []
  circuit.on("asyncEffect:end", (event) => errors.push(event.error))
  const settled = circuit.renderUntilSettled()
  const resistor = circuit.selectOne("resistor")!
  const childrenBeforeRemoval = resistor.children.length
  resistor.parent!.remove(resistor)
  await settled
  expect(requests).toHaveLength(1)
  expect(requests[0].signal.aborted).toBe(true)
  expect(requests[0].abortCount).toBe(1)
  expect(requests[0].hasAbortListener).toBe(false)
  expect(resistor.children).toHaveLength(childrenBeforeRemoval)
  expect(circuit.experimentalFootprintLoader!.activeJobCount).toBe(0)
  expect(circuit.getRunningAsyncEffects()).toHaveLength(0)
  expect(circuit.db.external_footprint_load_error.list()).toHaveLength(0)
  expect(errors).toEqual([undefined])
  expect(circuit.isDoneRendering()).toBe(true)
})
