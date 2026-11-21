import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import SepicBoard from "./assets/sepic-clearance/board"

test("autorouter traceClearance reaches the board routing input", async () => {
  for (const traceClearance of ["0.25mm", "0.50mm"]) {
    const { circuit } = getTestFixture({
      platform: { partsEngineDisabled: true, schematicDisabled: true },
    })
    let input: SimpleRouteJson | undefined
    circuit.on("autorouting:start", ({ simpleRouteJson }) => {
      input = simpleRouteJson
    })
    circuit.add(
      <SepicBoard
        autorouter={{ local: true, groupMode: "subcircuit", traceClearance }}
      />,
    )
    await circuit.renderUntilSettled()
    if (!input) throw new Error("Expected the board to start autorouting")

    expect(input.minTraceToPadEdgeClearance).toBe(
      Number.parseFloat(traceClearance),
    )
    expect(circuit.db.pcb_trace.list().length).toBeGreaterThan(8)

    // Annotation positions are in board coordinates (mm, +X right, +Y up).
    for (const [text, y] of [
      [`Requested autorouter.traceClearance: ${traceClearance}`, 26],
      [
        `Router input minTraceToPadEdgeClearance: ${input.minTraceToPadEdgeClearance} mm`,
        24,
      ],
      ["Routing-input reproduction; not a measured copper-gap annotation", -25],
    ] as const) {
      circuit.db.pcb_note_text.insert({
        text,
        anchor_position: { x: 0, y },
        anchor_alignment: "center",
        font: "tscircuit2024",
        font_size: 0.85,
        layer: "top",
        color: "#b91c1c",
      })
    }
    expect(circuit).toMatchPcbSnapshot(
      import.meta.path.replace(".test.tsx", `-${traceClearance}.test.tsx`),
      { showPcbNotes: true, shouldDrawRatsNest: false },
    )
  }
})
