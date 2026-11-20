import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import SepicBoard from "./assets/sepic-clearance/board"

test("repro: changing autorouter traceClearance leaves board routing input unchanged", async () => {
  const inputs: SimpleRouteJson[] = []
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
    inputs.push(input)

    // Characterize the bug: neither requested clearance reaches the router.
    // A fix should replace this with the requested clearance in millimetres.
    expect(input.minTraceToPadEdgeClearance).toBe(0.1)
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
  expect(inputs[0]).toEqual(inputs[1])
})
