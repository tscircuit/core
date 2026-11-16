import { expect, test } from "bun:test"
import { renderBoardWidthSrjRoundTrip } from "tests/fixtures/render-board-width-srj-roundtrip"

test("snapshots show the regenerated SRJ trace widths", async () => {
  const { circuit, widths } = await renderBoardWidthSrjRoundTrip()
  expect(widths).toMatchInlineSnapshot(`
    {
      "defaultConnectionWidth": 0.1,
      "explicitConnectionWidth": 0.55,
      "minTraceWidth": 0.1,
      "nominalTraceWidth": undefined,
    }
  `)

  circuit.db.pcb_note_text.insert({
    text: `SRJ default ${widths.defaultConnectionWidth.toFixed(2)} mm, explicit ${widths.explicitConnectionWidth.toFixed(2)} mm`,
    anchor_position: { x: 0, y: -4 },
    anchor_alignment: "center",
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.55,
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
