import { expect, test } from "bun:test"
import { ExplicitTraceWidthBoard } from "tests/fixtures/explicit-trace-width/board"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("repro: Pipeline9 relaxes an explicit 0.15 mm trace to 0.10 mm", async () => {
  // A fresh routing run proves a full-width route fits this exact placement.
  const { circuit: control } = getTestFixture()
  control.add(<ExplicitTraceWidthBoard minimumWidth={0.15} />)
  await control.renderUntilSettled()
  const controlWidths = control.db.pcb_trace
    .list()
    .flatMap((trace) =>
      trace.route.flatMap((point) =>
        point.route_type === "wire" ? [point.width] : [],
      ),
    )
  expect(controlWidths.length).toBeGreaterThan(0)
  expect(controlWidths.every((width) => Math.abs(width - 0.15) < 1e-6)).toBe(
    true,
  )

  const { circuit } = getTestFixture()
  circuit.add(<ExplicitTraceWidthBoard />)
  await circuit.renderUntilSettled()
  const sourceTrace = circuit.db.source_trace.getWhere({
    name: "MCU_VSSA_DECAP",
  })!
  const widths = circuit.db.pcb_trace
    .list()
    .filter((trace) => trace.source_trace_id === sourceTrace.source_trace_id)
    .flatMap((trace) =>
      trace.route.flatMap((point) =>
        point.route_type === "wire" ? [point.width] : [],
      ),
    )
  expect(sourceTrace.min_trace_thickness).toBe(0.15)
  expect(widths.length).toBeGreaterThan(0)
  // Capture the existing defect in the repro layer; the fix layer changes this.
  expect([...new Set(widths)]).toEqual([0.1])

  for (const [line, text] of [
    "U1.VSSA to C8.pin2: explicit width 0.15 mm",
    `Emitted copper: ${Math.min(...widths).toFixed(2)} mm (board minimum 0.10 mm)`,
    "Control: same placement routes at 0.15 mm",
  ].entries()) {
    circuit.db.pcb_note_text.insert({
      text,
      anchor_position: { x: 0, y: 9 - line * 0.85 },
      anchor_alignment: "center",
      font: "tscircuit2024",
      font_size: 0.55,
      layer: "top",
      color: "#ffffff",
    })
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1200,
    height: 1200,
    showPcbNotes: true,
    shouldDrawRatsNest: false,
  })
}, 120_000)
