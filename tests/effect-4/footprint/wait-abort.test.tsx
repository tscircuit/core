import { expect, test } from "bun:test"
import {
  createControlledFootprintFetch,
  createFootprintCircuit,
  footprintResponse,
} from "./helpers"

test("aborting one settlement caller retains the independently owned footprint job", async () => {
  const { fetchFootprint, requests } = createControlledFootprintFetch()
  const circuit = createFootprintCircuit({ fetch: fetchFootprint })
  const caller = new AbortController()
  const firstWait = circuit
    .renderUntilSettled({ signal: caller.signal })
    .catch((cause: unknown) => cause)
  const secondWait = circuit.renderUntilSettled()
  caller.abort()
  expect(await firstWait).toBe(caller.signal.reason)
  expect(requests[0].signal.aborted).toBe(false)
  expect(circuit.experimentalFootprintLoader!.activeJobCount).toBe(1)
  requests[0].resolve(footprintResponse())
  await secondWait
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
  expect(circuit.experimentalFootprintLoader!.activeJobCount).toBe(0)
  expect(circuit.getRunningAsyncEffects()).toHaveLength(0)
})
