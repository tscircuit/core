import { expect, test } from "bun:test"
import {
  createControlledFootprintFetch,
  createFootprintCircuit,
  footprintResponse,
} from "./helpers"

test("the commit guard suppresses a result after direct legacy removal marking", async () => {
  const { fetchFootprint, requests } = createControlledFootprintFetch()
  const circuit = createFootprintCircuit({ fetch: fetchFootprint })
  const settled = circuit.renderUntilSettled()
  const resistor = circuit.selectOne("resistor")!
  const childrenBeforeRemoval = resistor.children.length
  resistor.shouldBeRemoved = true
  expect(requests[0].signal.aborted).toBe(false)
  requests[0].resolve(footprintResponse())
  await settled
  expect(resistor.children).toHaveLength(childrenBeforeRemoval)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(0)
  expect(circuit.experimentalFootprintLoader!.activeJobCount).toBe(0)
  expect(circuit.getRunningAsyncEffects()).toHaveLength(0)
})
