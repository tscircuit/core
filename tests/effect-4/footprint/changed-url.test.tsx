import { expect, spyOn, test } from "bun:test"
import type { Resistor } from "lib/components"
import {
  createControlledFootprintFetch,
  createFootprintCircuit,
  footprintResponse,
} from "./helpers"

test("a footprint whose current resolved URL changes cannot commit the old request", async () => {
  const { fetchFootprint, requests } = createControlledFootprintFetch()
  const circuit = createFootprintCircuit({ fetch: fetchFootprint })
  const settled = circuit.renderUntilSettled()
  const resistor = circuit.firstChild!.selectOne<Resistor>("resistor")!
  const priorChildren = resistor.children.length
  const resolvedFootprint = spyOn(resistor, "resolveFootprint").mockReturnValue(
    "https://footprint.test/new.json",
  )
  try {
    requests[0].resolve(footprintResponse())
    await settled
    expect(resistor.children).toHaveLength(priorChildren)
    expect(circuit.db.pcb_smtpad.list()).toHaveLength(0)
    expect(circuit.experimentalFootprintLoader!.activeJobCount).toBe(0)
  } finally {
    resolvedFootprint.mockRestore()
  }
})
