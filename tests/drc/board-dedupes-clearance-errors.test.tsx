import { expect, test } from "bun:test"
import type { PcbSmtPadRect } from "circuit-json"
import type { Board } from "lib/components/normal-components/Board"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("board DRC inserts one typed error per pad/via trace pair", async () => {
  const { circuit } = getTestFixture()
  circuit.add(<board width="10mm" height="10mm" />)
  await circuit.renderUntilSettled()

  const board = circuit.firstChild as Board
  const subcircuitId = board.subcircuit_id
  if (!subcircuitId) throw new Error("Board did not create a subcircuit")

  const pad = circuit.db.pcb_smtpad.insert({
    subcircuit_id: subcircuitId,
    shape: "rect",
    x: 0,
    y: 0.2,
    width: 0.2,
    height: 0.2,
    layer: "top",
  } as Omit<PcbSmtPadRect, "type" | "pcb_smtpad_id">)
  const via = circuit.db.pcb_via.insert({
    subcircuit_id: subcircuitId,
    x: 0.5,
    y: 0.2,
    hole_diameter: 0.2,
    outer_diameter: 0.4,
    layers: ["top", "bottom"],
  })
  const trace = circuit.db.pcb_trace.insert({
    subcircuit_id: subcircuitId,
    route: [
      { route_type: "wire", x: -1, y: 0, width: 0.1, layer: "top" },
      { route_type: "wire", x: 1, y: 0, width: 0.1, layer: "top" },
    ],
  })

  board.doInitialPcbPlacementDesignRuleChecks()
  board._drcChecksComplete = false
  board.updatePcbDesignRuleChecks()
  await circuit.renderUntilSettled()

  const errors = circuit.getCircuitJson()
  expect(
    errors.filter((error) => error.type === "pcb_pad_trace_clearance_error"),
  ).toHaveLength(1)
  expect(
    errors.filter((error) => error.type === "pcb_via_trace_clearance_error"),
  ).toHaveLength(1)
  expect(
    errors.filter(
      (error) =>
        error.type === "pcb_trace_error" &&
        (error.pcb_trace_error_id ===
          `overlap_${trace.pcb_trace_id}_${pad.pcb_smtpad_id}` ||
          error.pcb_trace_error_id ===
            `overlap_${trace.pcb_trace_id}_${via.pcb_via_id}`),
    ),
  ).toHaveLength(0)
})
