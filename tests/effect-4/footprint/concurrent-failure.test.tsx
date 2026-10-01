import { expect, spyOn, test } from "bun:test"
import { RootCircuit } from "lib/RootCircuit"
import {
  createControlledFootprintFetch,
  footprintResponse,
  footprintUrl,
} from "./helpers"

test("a failed footprint job does not cancel or poison a concurrent successful job", async () => {
  const { fetchFootprint, requests } = createControlledFootprintFetch()
  const circuit = new RootCircuit({
    platform: { routingDisabled: true },
    experimentalFootprintLoading: { fetch: fetchFootprint },
  })
  circuit.add(
    <board width="20mm" height="10mm">
      <resistor name="R1" resistance="10k" footprint={footprintUrl} pcbX={-5} />
      <resistor name="R2" resistance="10k" footprint={footprintUrl} pcbX={5} />
    </board>,
  )
  const failure = new Error("transport disconnected")
  const errors: unknown[] = []
  circuit.on("asyncEffect:end", (event) => {
    if (event.effectName === "load-footprint-url") errors.push(event.error)
  })
  const log = spyOn(console, "error").mockImplementation(() => {})
  try {
    const settled = circuit.renderUntilSettled()
    expect(circuit.experimentalFootprintLoader!.activeJobCount).toBe(2)
    requests[0].reject(failure)
    requests[1].resolve(footprintResponse())
    await settled
    expect(requests).toHaveLength(2)
    expect(requests.every((request) => !request.signal.aborted)).toBe(true)
    expect(errors.filter(Boolean)).toEqual([String(failure)])
    expect(
      circuit.db.external_footprint_load_error.list()[0].message,
    ).toContain(failure.message)
    expect(circuit.db.pcb_smtpad.list()).toHaveLength(2)
    expect(circuit.experimentalFootprintLoader!.activeJobCount).toBe(0)
    expect(circuit.getRunningAsyncEffects()).toHaveLength(0)
  } finally {
    log.mockRestore()
  }
})
