import { expect, test } from "bun:test"
import { createKicadSegmentedCourtyardCircuit } from "./fixtures/kicad-segmented-courtyard"

test.failing(
  "a valid KiCad courtyard drawn as four lines should allow autorouting",
  async () => {
    const { circuit, getAutoroutingStartCount } =
      createKicadSegmentedCourtyardCircuit()
    await circuit.renderUntilSettled()

    expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
    expect(circuit.db.source_runtime_error.list()).toHaveLength(0)
    expect(getAutoroutingStartCount()).toBe(1)
    expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(0)
  },
  30_000,
)
