import { expect, test } from "bun:test"
import { checkCopperPourShorts } from "@tscircuit/checks"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import {
  getRetainedPourFixture,
  getRetainedPourHoleControls,
} from "./fixtures/retained-pour.fixture"
import {
  getRetainedPourWireOverlapArea,
  routeRetainedPourConnections,
} from "./fixtures/retained-pour-routing"

test("standalone handoff preserves retained pour copper without closing its holes", async () => {
  const { circuit, circuitJson } = await getRetainedPourFixture()
  const original = structuredClone(circuitJson)
  expect(
    circuitJson.filter((element) => element.type.endsWith("error")),
  ).toEqual([])
  const pour = circuit.db.pcb_copper_pour.list()[0]!
  expect(pour.shape).toBe("brep")
  if (pour.shape !== "brep") throw new Error("Expected generated BREP copper")
  expect(pour.brep_shape.inner_rings).toHaveLength(1)

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson,
    minTraceWidth: 0.2,
    minTraceToPadEdgeClearance: 0.2,
  })
  expect(simpleRouteJson.connections).toHaveLength(2)
  expect(
    simpleRouteJson.obstacles.filter((obstacle) =>
      obstacle.connectedTo.includes(pour.pcb_copper_pour_id),
    ),
  ).toHaveLength(4)

  const { routedTraces, vias } =
    await routeRetainedPourConnections(simpleRouteJson)
  for (const [traceIndex, pcbTrace] of routedTraces.entries()) {
    expect([pcbTrace.route[0], pcbTrace.route.at(-1)]).toEqual(
      expect.arrayContaining(
        simpleRouteJson.connections[traceIndex]!.pointsToConnect.map((point) =>
          expect.objectContaining({
            route_type: "wire",
            x: point.x,
            y: point.y,
            layer: point.layer,
          }),
        ),
      ),
    )
  }
  const signal = routedTraces[0]!
  const holeControl = routedTraces[1]!
  const routed = [...circuitJson, ...routedTraces, ...vias]
  const shorts = checkCopperPourShorts(routed)
  expect(shorts).toHaveLength(0)
  const overlapArea = getRetainedPourWireOverlapArea(pour, signal)
  expect(overlapArea).toBeLessThan(1e-9)
  expect(getRetainedPourWireOverlapArea(pour, signal, 0.2)).toBeLessThan(1e-9)
  expect(checkCopperPourShorts([...circuitJson, holeControl])).toHaveLength(0)
  expect(holeControl.route.every((point) => point.route_type === "wire")).toBe(
    true,
  )
  expect(
    holeControl.route.every(
      (point) => point.route_type === "wire" && point.layer === "top",
    ),
  ).toBe(true)
  expect(
    signal.route.filter((point) => point.route_type === "via"),
  ).toHaveLength(2)
  expect(
    signal.route.some(
      (point) => point.route_type === "wire" && point.layer === "bottom",
    ),
  ).toBe(true)
  expect(circuitJson).toEqual(original)
  const status = circuit.db.pcb_note_text.insert({
    font: "tscircuit2024",
    text: `FIXED: BOTTOM bridge | ${shorts.length} pour shorts | ${overlapArea.toFixed(2)} mm2 overlap`,
    anchor_position: { x: 0, y: 2.2 },
    anchor_alignment: "center",
    font_size: 0.32,
    layer: "top",
    color: "#ffcc00",
  })
  // Authored notes replace oversized automatic testpoint silkscreen only in
  // diagnostic views. Routing/checking still use every compiled record.
  await expect(
    [...routed, status].filter(
      (element) => element.type !== "pcb_silkscreen_text",
    ),
  ).toMatchPcbSnapshot(import.meta.path)

  const pipeline4Output = await routeRetainedPourConnections(
    simpleRouteJson,
    "pipeline4",
  )
  expect(pipeline4Output.routedTraces).toHaveLength(2)
  expect(
    checkCopperPourShorts([
      ...circuitJson,
      ...pipeline4Output.routedTraces,
      ...pipeline4Output.vias,
    ]),
  ).toHaveLength(1)
  expect(
    getRetainedPourWireOverlapArea(pour, pipeline4Output.routedTraces[0]!),
  ).toBeGreaterThan(0.1)
  const pipeline4Status = circuit.db.pcb_note_text.insert({
    font: "tscircuit2024",
    text: "Pipeline4: STILL UNSAFE | retained-copper GND short",
    anchor_position: { x: 0, y: 2.2 },
    anchor_alignment: "center",
    font_size: 0.32,
    layer: "top",
    color: "#ffcc00",
  })
  await expect(
    [
      ...circuitJson,
      ...pipeline4Output.routedTraces,
      ...pipeline4Output.vias,
      pipeline4Status,
    ].filter((element) => element.type !== "pcb_silkscreen_text"),
  ).toMatchPcbSnapshot(
    import.meta.path.replace(".test.tsx", "-pipeline4.test.tsx"),
  )

  const controls = await getRetainedPourHoleControls()
  const controlsOriginal = structuredClone(controls.circuitJson)
  const controlPour = controls.circuit.db.pcb_copper_pour.list()[0]!
  if (controlPour.shape !== "brep") throw new Error("Expected BREP controls")
  expect(controlPour.brep_shape.inner_rings).toHaveLength(2)
  const controlInput = getSimpleRouteJsonFromCircuitJson({
    circuitJson: controls.circuitJson,
    minTraceWidth: 0.1,
  }).simpleRouteJson
  // KRT exercises the many curved/rotated obstacle spans; the short regression
  // above keeps Pipeline9. Both baseline and fix use these same backends.
  const controlOutput = await routeRetainedPourConnections(
    {
      ...controlInput,
      connections: controlInput.connections.filter(
        (connection) => connection.name === connection.source_trace_id,
      ),
    },
    "krt",
  )
  expect(controlOutput.routedTraces).toHaveLength(3)
  expect(
    new Set(controlOutput.routedTraces.map((trace) => trace.pcb_trace_id)).size,
  ).toBe(3)
  expect(controlOutput.vias).toHaveLength(0)
  expect(
    checkCopperPourShorts([
      ...controls.circuitJson,
      ...controlOutput.routedTraces,
    ]),
  ).toHaveLength(0)
  expect(controls.circuitJson).toEqual(controlsOriginal)
  const controlRouteNotes = controlOutput.routedTraces.map((trace) =>
    controls.circuit.db.pcb_note_path.insert({
      // Display the actual computed centerline above same-net copper.
      route: trace.route.flatMap((point) =>
        point.route_type === "through_pad" ? [] : [{ x: point.x, y: point.y }],
      ),
      layer: "top",
      stroke_width: 0.05,
      color: "#00ffff",
    }),
  )
  await expect(
    [
      ...controls.circuitJson,
      ...controlOutput.routedTraces,
      ...controlRouteNotes,
    ].filter((element) => element.type !== "pcb_silkscreen_text"),
  ).toMatchPcbSnapshot(
    import.meta.path.replace(".test.tsx", "-controls.test.tsx"),
  )

  const bottom = await getRetainedPourFixture("bottom")
  const bottomInput = getSimpleRouteJsonFromCircuitJson({
    circuitJson: bottom.circuitJson,
    minTraceWidth: 0.2,
  }).simpleRouteJson
  const bottomOutput = await routeRetainedPourConnections(bottomInput)
  expect(bottomOutput.vias).toHaveLength(0)
  expect(
    checkCopperPourShorts([
      ...bottom.circuitJson,
      ...bottomOutput.routedTraces,
    ]),
  ).toHaveLength(0)
  expect(
    getSimpleRouteJsonFromCircuitJson({
      circuitJson,
      ignoreExistingTopLevelPcbRouteState: true,
    }).simpleRouteJson.obstacles.filter((obstacle) =>
      obstacle.connectedTo.includes(pour.pcb_copper_pour_id),
    ),
  ).toHaveLength(0)
  expect(
    getSimpleRouteJsonFromCircuitJson({
      db: circuit.db,
      subcircuitComponent: circuit.firstChild!,
    }).simpleRouteJson.obstacles.filter((obstacle) =>
      obstacle.connectedTo.includes(pour.pcb_copper_pour_id),
    ),
  ).toHaveLength(0)
})
