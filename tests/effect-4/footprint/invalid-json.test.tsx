import { expect, spyOn, test } from "bun:test"
import { createFootprintCircuit } from "./helpers"

test("existing importer conversion failures remain terminal and never attach partial children", async () => {
  let attempts = 0
  const circuit = createFootprintCircuit({
    maxRetries: 2,
    fetch: async () => {
      attempts++
      return Response.json([
        {
          type: "pcb_smtpad",
          shape: "rect",
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          layer: "top",
          port_hints: ["1"],
        },
        {
          type: "pcb_keepout",
          shape: "rect",
          center: { x: 1, y: 0 },
          width: 1,
          height: 1,
          layers: null,
        },
      ])
    },
  })
  const log = spyOn(console, "error").mockImplementation(() => {})
  try {
    const settled = circuit.renderUntilSettled()
    const childrenBeforeLoad = circuit.selectOne("resistor")!.children.length
    await settled
    expect(attempts).toBe(1)
    expect(circuit.selectOne("resistor")!.children).toHaveLength(
      childrenBeforeLoad,
    )
    expect(circuit.db.pcb_smtpad.list()).toHaveLength(0)
    expect(circuit.db.external_footprint_load_error.list()).toHaveLength(1)
    expect(circuit.experimentalFootprintLoader!.activeJobCount).toBe(0)
    expect(circuit.isDoneRendering()).toBe(true)
    expect(log).toHaveBeenCalledTimes(1)
  } finally {
    log.mockRestore()
  }
})
