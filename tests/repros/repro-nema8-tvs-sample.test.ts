import { expect, test } from "bun:test"
import { su } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement, PcbNoteText } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { getSourceTraceIdForRoutedTrace } from "lib/components/primitive-components/Group/get-source-trace-id-for-routed-trace"
import fixture from "../fixtures/nema8-tvs-sample/circuit.json"

test("the NEMA8 TVS sample accepts a saved VM route ending on GND", async () => {
  const circuitJson = fixture as AnyCircuitElement[]
  const db = su(circuitJson)
  const trace = db.pcb_trace.list()[0]
  expect(getSourceTraceIdForRoutedTrace({ db, trace })).toBe("source_trace_8")

  const resultNote: PcbNoteText = {
    type: "pcb_note_text",
    pcb_note_text_id: "core_result",
    anchor_position: { x: 1.2, y: 0.45 },
    anchor_alignment: "center",
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.32,
    color: "#0f172a",
    text: "Core accepts conflicting VM/GND endpoints",
  }
  await expect(
    convertCircuitJsonToPcbSvg([...circuitJson, resultNote], {
      width: 1000,
      height: 660,
      backgroundColor: "#fff",
      includeVersion: false,
      showPinNumbers: true,
      shouldDrawRatsNest: false,
      viewport: { minX: -4.2, maxX: 7, minY: 0, maxY: 7.4 },
    }),
  ).toMatchSvgSnapshot(import.meta.path, undefined, {
    diffThresholdPercent: 0,
  })
})
