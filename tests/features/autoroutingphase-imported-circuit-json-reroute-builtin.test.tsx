import { expect, test } from "bun:test"
import type { CircuitJson, PcbTrace, PcbTraceRoutePoint } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const rerouteRegion = {
  shape: "rect" as const,
  minX: -3,
  maxX: 3,
  minY: -3,
  maxY: 3,
}

const rerouteRegionCenter = {
  x: (rerouteRegion.minX + rerouteRegion.maxX) / 2,
  y: (rerouteRegion.minY + rerouteRegion.maxY) / 2,
}

const rerouteVisualMarker = {
  width: 9,
  height: 8,
}

const routeSignature = (route: PcbTraceRoutePoint[]) =>
  JSON.stringify(
    route.map((point) => ({
      ...point,
      x: "x" in point ? Number(point.x.toFixed(3)) : undefined,
      y: "y" in point ? Number(point.y.toFixed(3)) : undefined,
    })),
  )

const getImportedCircuitJson = async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="22mm" height="14mm">
      <resistor
        name="R_LEFT"
        resistance="1k"
        footprint="0603"
        pcbX={-8}
        pcbY={0}
      />
      <resistor
        name="R_RIGHT"
        resistance="1k"
        footprint="0603"
        pcbX={8}
        pcbY={0}
      />
      <resistor
        name="R_BLOCKER"
        resistance="1k"
        footprint="0603"
        pcbX={0}
        pcbY={0}
      />
      <trace
        from=".R_LEFT > .pin1"
        to=".R_RIGHT > .pin1"
        pcbPath={[
          { x: 4, y: 0 },
          { x: 8, y: 0 },
          { x: 12, y: 0 },
        ]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson() as CircuitJson
  const sourceTrace = circuitJson.find((elm) => elm.type === "source_trace")
  expect(sourceTrace).toBeDefined()

  const pcbTrace = circuitJson.find(
    (elm): elm is PcbTrace =>
      elm.type === "pcb_trace" &&
      elm.source_trace_id === sourceTrace!.source_trace_id,
  )
  expect(pcbTrace).toBeDefined()

  return {
    circuitJson,
    sourceTraceId: sourceTrace!.source_trace_id,
    originalRouteSignature: routeSignature(pcbTrace!.route),
  }
}

test("autoroutingphase reroutes an imported circuit json region with the builtin autorouter", async () => {
  const { circuit } = getTestFixture()
  const { circuitJson, sourceTraceId, originalRouteSignature } =
    await getImportedCircuitJson()

  circuit.add(
    <board width="22mm" height="14mm">
      <subcircuit circuitJson={circuitJson} />
      <pcbnoterect
        pcbX={rerouteRegionCenter.x}
        pcbY={rerouteRegionCenter.y}
        width={rerouteVisualMarker.width}
        height={rerouteVisualMarker.height}
        color="rgba(255,140,0,0.95)"
        strokeWidth={0.16}
        isStrokeDashed
      />
      <pcbnotetext
        text="BUILT-IN REROUTE REGION"
        pcbX={rerouteRegionCenter.x}
        pcbY={rerouteRegionCenter.y + rerouteVisualMarker.height / 2 + 0.9}
        fontSize={0.7}
        color="rgba(180,70,0,1)"
      />
      <autoroutingphase reroute region={rerouteRegion} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const targetTraceRoutes = circuit.db.pcb_trace
    .list()
    .filter((trace) => trace.source_trace_id === sourceTraceId)
    .map((trace) => trace.route)

  expect(targetTraceRoutes.length).toBeGreaterThan(0)
  expect(targetTraceRoutes.map(routeSignature)).not.toContain(
    originalRouteSignature,
  )
  expect(
    targetTraceRoutes
      .flat()
      .filter((point) => point.route_type === "wire")
      .some(
        (point) =>
          point.x > rerouteRegion.minX &&
          point.x < rerouteRegion.maxX &&
          Math.abs(point.y) > 0.4,
      ),
  ).toBe(true)

  expect(circuit.db.pcb_note_rect.list()).toHaveLength(1)
  expect(circuit.db.pcb_note_text.list()).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
