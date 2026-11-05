import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import "tests/fixtures/get-test-fixture"
import fixture from "../assets/nema34-max-length.circuit.json"

test("NEMA34 drops its source-trace length limits at SRJ export", async () => {
  // techmannih/nema34-mounted-stepper-controller, source 7a54a7aee83ff41d1947169a9b8ed77d6bef4310.
  // Frozen source and PCB geometry after removing manual routing. Schematic,
  // CAD and rendered pour records are omitted to isolate the converter.
  const circuitJson = structuredClone(fixture) as AnyCircuitElement[]
  const original = structuredClone(circuitJson)
  const constrainedTraces = circuitJson.filter(
    (element) => element.type === "source_trace" && element.max_length != null,
  )
  expect(constrainedTraces).toHaveLength(220)
  expect(constrainedTraces.filter((trace) => "name" in trace)).toHaveLength(60)
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({ circuitJson })
  const exportedConstraints =
    Reflect.get(simpleRouteJson, "routeConstraints") ?? []
  expect(exportedConstraints).toHaveLength(0)
  expect(circuitJson).toEqual(original)

  circuitJson.push({
    type: "pcb_note_text",
    pcb_note_text_id: "nema34_length_caption",
    text: `NEMA34: ${constrainedTraces.length} length limits; exported ${exportedConstraints.length}`,
    anchor_position: { x: 0, y: 46 },
    anchor_alignment: "center",
    font: "tscircuit2024",
    font_size: 1.3,
    layer: "top",
  })
  await expect(circuitJson).toMatchPcbSnapshot(import.meta.path, {
    width: 1000,
    height: 1000,
  })
})
