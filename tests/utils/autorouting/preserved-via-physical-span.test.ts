import { expect, test } from "bun:test"
import { su } from "@tscircuit/circuit-json-util"
import {
  pcb_trace,
  source_group,
  source_board,
  type AnyCircuitElement,
} from "circuit-json"
import {
  getFixedViaPhysicalSpanFixture,
  physicalBoardLayers,
} from "tests/fixtures/fixed-via-physical-span"
import { getPreservedRoutedSubcircuitTraces } from "lib/utils/autorouting/getPreservedRoutedSubcircuitTraces"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getBusLanesInputFromSrj } from "lib/utils/autorouting/get-bus-lanes-input-from-srj"
import { getCircuitJsonPcbTraceRoute } from "lib/utils/autorouting/get-circuit-json-pcb-trace-route"

test("preserve shared and explicit stored via spans without mutating copper", () => {
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
  ).toEqual([physicalBoardLayers, physicalBoardLayers])
  expect(
    getSimpleRouteJsonFromCircuitJson({
      circuitJson: shared,
    }).simpleRouteJson.obstacles.filter(
      (obstacle) => obstacle.circuitJsonMetadata?.pcb_via_id,
    ),
  ).toHaveLength(0)
  expect(shared).toEqual(original)

  // The public import path inherits missing PCBTrace scope from SourceTrace.
  // A shared old blind barrel can be linked only to its first imported trace,
  // with the optional PCBVia scope absent. This is still known physical copper.
  const oldBlindTrace = fixture.circuitJson
    .filter((element) => element.type === "pcb_trace")
    .find((trace) => trace.pcb_trace_id === "existing_blind")!
  const unscoped: AnyCircuitElement[] = [
    source_group.parse({
      type: "source_group",
      source_group_id: "imported_group",
      name: "Imported board",
      is_subcircuit: true,
      subcircuit_id: "board",
    }),
    source_board.parse({
      type: "source_board",
      source_board_id: "imported_board",
      source_group_id: "imported_group",
      title: "Imported board",
    }),
    ...fixture.circuitJson,
    {
      ...oldBlindTrace,
      pcb_trace_id: "shared_old_blind",
      route: getCircuitJsonPcbTraceRoute(oldBlindTrace.route),
    },
  ].map((element) => {
    if (element.type === "pcb_board")
      return { ...element, source_board_id: "imported_board" }
    if (element.type !== "pcb_trace" && element.type !== "pcb_via")
      return element
    const { subcircuit_id: _scope, ...physicalElement } = element
    return physicalElement
  })
  const unscopedOriginal = structuredClone(unscoped)
  for (const subcircuit_id of [undefined, "board"]) {
    const imported = getSimpleRouteJsonFromCircuitJson({
      circuitJson: unscoped,
      subcircuit_id,
    }).simpleRouteJson
    const importedBus = getBusLanesInputFromSrj(imported)
    expect(imported.allowBlindAndBuriedVias).toBe(false)
    expect(
      importedBus.traces
        ?.find((trace) => trace.pcb_trace_id === "shared_old_blind")
        ?.route.find((point) => point.route_type === "via")?.layers,
    ).toEqual(["top", "inner1"])
    expect(
      imported.obstacles.filter(
        (obstacle) => obstacle.circuitJsonMetadata?.pcb_via_id,
      ),
    ).toHaveLength(0)
  }
  expect(
    getSimpleRouteJsonFromCircuitJson({
      circuitJson: unscoped,
      subcircuit_id: "board",
      ignoreExistingTopLevelPcbRouteState: true,
    }).simpleRouteJson.traces,
  ).toBeUndefined()
  expect(unscoped).toEqual(unscopedOriginal)

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
  ).toEqual(["top", "inner1"])
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
  ).toThrow("Existing routed via has ambiguous physical layer spans")
  expect(ambiguous).toEqual(ambiguousOriginal)

  const conflictingEndpoint: AnyCircuitElement[] = fixture.circuitJson.map(
    (element) =>
      element.type === "pcb_trace" && element.pcb_trace_id === "existing_blind"
        ? {
            ...element,
            route: getCircuitJsonPcbTraceRoute(element.route).map((point) =>
              point.route_type === "via"
                ? { ...point, to_layer: "bottom" as const }
                : point,
            ),
          }
        : element,
  )
  const conflictingOriginal = structuredClone(conflictingEndpoint)
  expect(() =>
    getPreservedRoutedSubcircuitTraces({
      scopedDb: su(conflictingEndpoint),
      relevantSubcircuitIds: null,
    }),
  ).toThrow(
    "Existing routed via's physical span does not include its routed layers",
  )
  expect(conflictingEndpoint).toEqual(conflictingOriginal)
  expect(throughVia.layers).toEqual(physicalBoardLayers)
})
