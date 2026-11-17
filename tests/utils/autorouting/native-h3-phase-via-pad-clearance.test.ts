import { expect, test } from "bun:test"
import { pcb_board, type AnyCircuitElement } from "circuit-json"
import { checkNativeH3PhaseViaPadClearance } from "../../fixtures/h3-routing-phase-intent/assess"

/** Two different-net copper shapes in board-world mm, +X right, +Y up.
 * Their real edge gap is 0.14mm or 0.04mm; no router or generated copper is
 * mocked. The board's 0.3mm rule also proves the phase's explicit rule applies.
 */
const boardWithGap = (gap: number): AnyCircuitElement[] => [
  pcb_board.parse({
    type: "pcb_board",
    pcb_board_id: "board",
    center: { x: 0.3, y: 0 },
    width: 2.5,
    height: 1.5,
    min_via_edge_to_pad_edge_clearance: 0.3,
    min_pad_edge_to_pad_edge_clearance: 0.3,
  }),
  {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad",
    shape: "rect",
    layer: "top",
    x: 0,
    y: 0,
    width: 0.6,
    height: 0.5,
  },
  {
    type: "pcb_via",
    pcb_via_id: "via",
    layers: ["top", "bottom"],
    x: 0.5 + gap,
    y: 0,
    outer_diameter: 0.4,
    hole_diameter: 0.2,
  },
]

test("native phase via-pad checks honor specific rules and keep real copper violations", () => {
  const rules = {
    minViaEdgeToPadEdgeClearance: 0.1,
    minPadEdgeToPadEdgeClearance: 0.2,
  }
  const legal = checkNativeH3PhaseViaPadClearance(boardWithGap(0.14), rules)
  expect(legal.findings).toHaveLength(0)

  const belowBoth = checkNativeH3PhaseViaPadClearance(boardWithGap(0.04), rules)
  expect(belowBoth.findings).toHaveLength(1)
  expect(belowBoth.findings[0]?.actual_clearance).toBeCloseTo(0.04)
  expect(belowBoth.findings[0]?.minimum_clearance).toBe(0.1)

  const largerSpecific = checkNativeH3PhaseViaPadClearance(boardWithGap(0.14), {
    minViaEdgeToPadEdgeClearance: 0.2,
    minPadEdgeToPadEdgeClearance: 0.1,
  })
  expect(largerSpecific.findings).toHaveLength(1)
  expect(largerSpecific.findings[0]?.minimum_clearance).toBe(0.2)

  const explicitZero = checkNativeH3PhaseViaPadClearance(boardWithGap(0.04), {
    minViaEdgeToPadEdgeClearance: 0,
    minPadEdgeToPadEdgeClearance: 0.2,
  })
  expect(explicitZero.findings).toHaveLength(0)

  const genericFallback = checkNativeH3PhaseViaPadClearance(boardWithGap(0.14), {
    minPadEdgeToPadEdgeClearance: 0.2,
  })
  expect(genericFallback.findings).toHaveLength(1)
  expect(genericFallback.findings[0]?.minimum_clearance).toBe(0.2)

  const boardFallback = checkNativeH3PhaseViaPadClearance(boardWithGap(0.14), {})
  expect(boardFallback.findings).toHaveLength(1)
  expect(boardFallback.findings[0]?.minimum_clearance).toBe(0.3)
})
