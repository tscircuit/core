import { expect, test } from "bun:test"
import type { AnyCircuitElement, PcbPort, SourceTrace } from "circuit-json"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import "tests/fixtures/get-test-fixture"
import fixture from "../assets/nema34-max-length.circuit.json"

test("NEMA34 exports each length limit once with its original terminal scope", async () => {
  // techmannih/nema34-mounted-stepper-controller, source 7a54a7aee83ff41d1947169a9b8ed77d6bef4310.
  // Frozen source and PCB geometry after removing manual routing. Schematic,
  // CAD and rendered pour records are omitted to isolate the converter.
  const circuitJson = structuredClone(fixture) as AnyCircuitElement[]
  const original = structuredClone(circuitJson)
  const constrainedTraces = circuitJson.filter(
    (element): element is SourceTrace =>
      element.type === "source_trace" && element.max_length != null,
  )
  expect(constrainedTraces).toHaveLength(220)
  expect(constrainedTraces.filter((trace) => "name" in trace)).toHaveLength(60)
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({ circuitJson })
  const exportedConstraints = simpleRouteJson.routeConstraints ?? []
  expect(exportedConstraints).toHaveLength(constrainedTraces.length)
  expect(
    new Set(exportedConstraints.map((rule) => rule.sourceTraceId)).size,
  ).toBe(constrainedTraces.length)
  for (const trace of constrainedTraces) {
    const rule = exportedConstraints.find(
      (candidate) => candidate.sourceTraceId === trace.source_trace_id,
    )!
    const expectedPortIds = trace.connected_source_port_ids
      .map(
        (sourcePortId) =>
          circuitJson.find(
            (element): element is PcbPort =>
              element.type === "pcb_port" &&
              element.source_port_id === sourcePortId,
          )!,
      )
      .map((port) => port.pcb_port_id)
    expect(rule.maxLength).toBe(trace.max_length)
    expect(rule.pointIds).toEqual(expectedPortIds)
    const connection = simpleRouteJson.connections.find(
      (candidate) => candidate.name === rule.connectionName,
    )!
    for (const pointId of rule.pointIds) {
      expect(
        connection.pointsToConnect.some((point) => point.pointId === pointId),
      ).toBe(true)
    }
  }

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
