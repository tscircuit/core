import { expect, test } from "bun:test"
import { su } from "@tscircuit/circuit-json-util"
import { pcb_trace, type AnyCircuitElement } from "circuit-json"
import {
  getFixedViaPhysicalSpanFixture,
  physicalBoardLayers,
} from "tests/fixtures/fixed-via-physical-span"
import { getPreservedRoutedSubcircuitTraces } from "lib/utils/autorouting/getPreservedRoutedSubcircuitTraces"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

test("reproduce loss of shared and explicit stored via spans without mutating copper", () => {
  const fixture = getFixedViaPhysicalSpanFixture()
  const throughVia = fixture.circuitJson
    .filter((element) => element.type === "pcb_via")
    .find((via) => via.x === -2)!
  const branch = pcb_trace.parse({
    type: "pcb_trace",
    pcb_trace_id: "shared_through",
    source_trace_id: "through_signal",
    subcircuit_id: "board",
    route: [
      { route_type: "wire", x: -2, y: 3, width: 0.2, layer: "top" },
      { route_type: "wire", x: -2, y: 1, width: 0.2, layer: "top" },
      {
        route_type: "via",
        x: -2,
        y: 1,
        from_layer: "top",
        to_layer: "inner1",
        outer_diameter: 0.6,
        hole_diameter: 0.3,
      },
      { route_type: "wire", x: -2, y: 1, width: 0.2, layer: "inner1" },
      { route_type: "wire", x: -2, y: 3, width: 0.2, layer: "inner1" },
    ],
  })
  const shared: AnyCircuitElement[] = [
    ...fixture.circuitJson,
    branch,
    { ...throughVia, pcb_via_id: "duplicate_same_barrel" },
  ]
  const original = structuredClone(shared)
  const recovered = getPreservedRoutedSubcircuitTraces({
    scopedDb: su(shared),
    relevantSubcircuitIds: null,
  })
  expect(
    recovered
      .filter((trace) => trace.pcb_trace_id !== "existing_blind")
      .map(
        (trace) =>
          trace.route.find((point) => point.route_type === "via")?.layers,
      ),
  ).toEqual([undefined, undefined])
  expect(
    getSimpleRouteJsonFromCircuitJson({
      circuitJson: shared,
    }).simpleRouteJson.obstacles.filter(
      (obstacle) => obstacle.circuitJsonMetadata?.pcb_via_id,
    ),
  ).toHaveLength(2)
  expect(shared).toEqual(original)

  const explicit: AnyCircuitElement[] = [
    {
      ...branch,
      route: branch.route.map((point) =>
        point.route_type === "via"
          ? { ...point, layers: ["top", "inner1"] }
          : point,
      ),
    },
  ]
  const explicitOriginal = structuredClone(explicit)
  expect(
    getPreservedRoutedSubcircuitTraces({
      scopedDb: su(explicit),
      relevantSubcircuitIds: null,
    })[0]?.route.find((point) => point.route_type === "via")?.layers,
  ).toBeUndefined()
  expect(explicit).toEqual(explicitOriginal)

  const ambiguous: AnyCircuitElement[] = [
    ...fixture.circuitJson,
    {
      ...throughVia,
      pcb_via_id: "different_physical_span",
      layers: ["top", "inner1"],
    },
  ]
  const ambiguousOriginal = structuredClone(ambiguous)
  expect(() =>
    getPreservedRoutedSubcircuitTraces({
      scopedDb: su(ambiguous),
      relevantSubcircuitIds: null,
    }),
  ).not.toThrow()
  expect(ambiguous).toEqual(ambiguousOriginal)
  expect(throughVia.layers).toEqual(physicalBoardLayers)
})
