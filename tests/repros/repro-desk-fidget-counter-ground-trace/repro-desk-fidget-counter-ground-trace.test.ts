import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { su } from "@tscircuit/circuit-json-util"
import type { AnyCircuitElement, PcbNoteText } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { markTraceSegmentsInsideCopperPour } from "lib/components/primitive-components/CopperPour/utils/mark-trace-segments-inside-copper-pour"
import { getTraceRouteWithoutPourAnnotations } from "tests/fixtures/get-trace-route-without-pour-annotations"

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
  const junction = { x: 17.4804, y: 27.1958, layer: "top" }
  expect(continuation.route[1]).toMatchObject(junction)
  expect(diagonal.route[0]).toMatchObject(junction)
  const padConnection = db.pcb_trace.get("pcb_trace_external_233")!
  const elbow = db.pcb_trace.get("pcb_trace_external_234")!
  const padJunction = { x: 10.8, y: 33.5033, layer: "top" }
  expect(padConnection.route[0]).toMatchObject(padJunction)
  expect(elbow.route[1]).toMatchObject(padJunction)
  const padConnectionVisible = !padConnection.route.every(
    (point) => point.route_type === "wire" && point.is_inside_copper_pour,
  )
  const continuationVisible = !continuation.route.every(
    (point) => point.route_type === "wire" && point.is_inside_copper_pour,
  )

  expect(padConnectionVisible, "C1 ground pad connection").toBe(true)
  expect(continuationVisible, "GND continuation").toBe(true)

  const labels: PcbNoteText[] = [
    "Desk fidget counter / pours hidden",
    padConnectionVisible ? "C1 pad connected" : "BUG: C1 pad connection hidden",
    continuationVisible ? "Continuation visible" : "BUG: continuation hidden",
  ].map((text, line) => ({
    type: "pcb_note_text",
    pcb_note_text_id: `continuation_label_${line}`,
    layer: "top",
    font: "tscircuit2024",
    font_size: 1,
    anchor_position: { x: 0, y: 47 - line * 1.6 },
    anchor_alignment: "center",
    color: "#cbd5e1",
    text,
  }))
  // Hide pour fills only after classification.
  const drawing = db
    .toArray()
    .filter((record) => record.type !== "pcb_copper_pour")
  await expect(
    convertCircuitJsonToPcbSvg([...drawing, ...labels], {
      layer: "top",
      width: 1200,
      height: 1500,
      includeVersion: false,
      viewport: { minX: -38, maxX: 38, minY: -46, maxY: 49 },
    }),
  ).toMatchSvgSnapshot(import.meta.path, undefined, { diffThresholdPercent: 0 })
})
