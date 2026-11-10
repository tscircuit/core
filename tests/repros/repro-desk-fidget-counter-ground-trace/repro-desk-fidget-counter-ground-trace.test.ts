import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { su } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement, PcbNoteText } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { markTraceSegmentsInsideCopperPour } from "lib/components/primitive-components/CopperPour/utils/mark-trace-segments-inside-copper-pour"
import { getTraceRouteWithoutPourAnnotations } from "tests/fixtures/get-trace-route-without-pour-annotations"

/** Board-world points in mm: +X right, +Y up, +Z above the PCB (right handed). */
test("desk fidget counter ground continuation with copper pours hidden", async () => {
  const circuitJson: AnyCircuitElement[] = JSON.parse(
    readFileSync(
      new URL("./desk-fidget-counter.fixture.json", import.meta.url),
      "utf8",
    ),
  )
  const withoutVisibility = (records: AnyCircuitElement[]) =>
    records.map((record) =>
      record.type === "pcb_trace"
        ? {
            ...record,
            route: getTraceRouteWithoutPourAnnotations(record.route),
          }
        : record,
    )
  const originalCopper = withoutVisibility(structuredClone(circuitJson))
  const db = su(circuitJson)
  for (const copperPour of db.pcb_copper_pour.list()) {
    markTraceSegmentsInsideCopperPour({ db, copperPour })
  }
  expect(withoutVisibility(db.toArray())).toEqual(originalCopper)

  const continuation = db.pcb_trace.get("pcb_trace_external_236")!
  const diagonal = db.pcb_trace.get("pcb_trace_external_235")!
  // This same-layer copper junction exists even when its continuation is hidden.
  const junction = { x: 17.4804, y: 27.1958, layer: "top" }
  expect(continuation.route[1]).toMatchObject(junction)
  expect(diagonal.route[0]).toMatchObject(junction)
  const continuationVisible = !continuation.route.every(
    (point) => point.route_type === "wire" && point.is_inside_copper_pour,
  )

  const labels: PcbNoteText[] = [
    "C1 GND / pours hidden",
    continuationVisible ? "Continuation visible" : "BUG: continuation hidden",
  ].map((text, line) => ({
    type: "pcb_note_text",
    pcb_note_text_id: `continuation_label_${line}`,
    layer: "top",
    font: "tscircuit2024",
    font_size: 0.38,
    anchor_position: { x: 11.2, y: 26.5 - line * 0.7 },
    anchor_alignment: "center",
    color: "#cbd5e1",
    text,
  }))
  // Classify against the full board, then hide pours only in the rendered copy.
  const drawing = db
    .toArray()
    .filter((record) => record.type !== "pcb_copper_pour")
  await expect(
    convertCircuitJsonToPcbSvg([...drawing, ...labels], {
      layer: "top",
      width: 600,
      height: 600,
      includeVersion: false,
      viewport: { minX: 6, maxX: 19, minY: 23, maxY: 36 },
    }),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})
