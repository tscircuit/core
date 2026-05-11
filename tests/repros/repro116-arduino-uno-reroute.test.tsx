import { expect, test } from "bun:test"
import { KicadToCircuitJsonConverter } from "kicad-to-circuit-json"
import fs from "node:fs"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type { CircuitJson, PcbTraceRoutePoint } from "circuit-json"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const rerouteRegion = {
  shape: "rect" as const,
  minX: 8,
  maxX: 18,
  minY: 8,
  maxY: 18,
}

const rerouteRegionCenter = {
  x: (rerouteRegion.minX + rerouteRegion.maxX) / 2,
  y: (rerouteRegion.minY + rerouteRegion.maxY) / 2,
}

const routeSignature = (route: PcbTraceRoutePoint[]) =>
  JSON.stringify(
    route.map((point) => ({
      ...point,
      x: "x" in point ? Number(point.x.toFixed(3)) : undefined,
      y: "y" in point ? Number(point.y.toFixed(3)) : undefined,
      width: "width" in point ? Number(point.width.toFixed(3)) : undefined,
    })),
  )

const getSourceTraceIdFromRerouteConnectionName = (name: string) => {
  const rerouteSuffixIndex = name.indexOf("_reroute_")
  if (rerouteSuffixIndex === -1) return name
  return name.slice(0, rerouteSuffixIndex)
}

const routeTouchesRegion = (route: PcbTraceRoutePoint[]) =>
  route.some(
    (point) =>
      point.route_type === "wire" &&
      point.x >= rerouteRegion.minX - 1e-6 &&
      point.x <= rerouteRegion.maxX + 1e-6 &&
      point.y >= rerouteRegion.minY - 1e-6 &&
      point.y <= rerouteRegion.maxY + 1e-6,
  )

const loadArduinoUnoCircuitJson = () => {
  const converter = new KicadToCircuitJsonConverter()
  converter.addFile(
    "tests/repros/assets/arduino-uno.source.kicad_pcb",
    fs.readFileSync("tests/repros/assets/arduino-uno.source.kicad_pcb", "utf8"),
  )
  converter.runUntilFinished()
  return converter.getOutput() as CircuitJson
}

const renderRerouteRegionNote = () => (
  <>
    <pcbnoterect
      pcbX={rerouteRegionCenter.x}
      pcbY={rerouteRegionCenter.y}
      width={rerouteRegion.maxX - rerouteRegion.minX}
      height={rerouteRegion.maxY - rerouteRegion.minY}
      color="rgba(255,140,0,0.95)"
      strokeWidth={0.6}
      isStrokeDashed
    />
    <pcbnotetext
      text="REROUTED REGION 10MM"
      pcbX={rerouteRegionCenter.x}
      pcbY={rerouteRegion.maxY + 1.2}
      fontSize={1.2}
      color="rgba(255,180,60,1)"
    />
  </>
)

const addArduinoUnoBoard = ({
  circuit,
  arduinoUnoCircuitJson,
  includeReroutePhase,
}: {
  circuit: ReturnType<typeof getTestFixture>["circuit"]
  arduinoUnoCircuitJson: CircuitJson
  includeReroutePhase: boolean
}) => {
  circuit.add(
    <board>
      <subcircuit circuitJson={structuredClone(arduinoUnoCircuitJson)} />
      {renderRerouteRegionNote()}
      {includeReroutePhase && (
        <autoroutingphase reroute region={rerouteRegion} />
      )}
    </board>,
  )
}

const createPanelLabelSvg = (label: string) => `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="800"
  height="36"
  viewBox="0 0 800 36"
>
  <rect x="0" y="0" width="800" height="36" fill="#121212" />
  <text
    x="400"
    y="23"
    fill="#f4f4f4"
    font-family="Arial, sans-serif"
    font-size="18"
    font-weight="700"
    text-anchor="middle"
  >${label}</text>
</svg>`

const createLabeledPanelSvg = (label: string, pcbSvg: string) =>
  stackSvgsVertically([createPanelLabelSvg(label), pcbSvg], {
    gap: 0,
    normalizeSize: false,
  })

test("repro116: arduino uno circuit json can reroute an imported region with the builtin autorouter", async () => {
  const { circuit: beforeRerouteCircuit } = getTestFixture()
  const { circuit: afterRerouteCircuit } = getTestFixture()
  const phaseInputs: SimpleRouteJson[] = []

  afterRerouteCircuit.on("autorouting:start", (event) => {
    phaseInputs.push(structuredClone(event.simpleRouteJson))
  })

  const arduinoUnoCircuitJson = loadArduinoUnoCircuitJson()

  const originalRouteSignaturesBySourceTraceId = new Map<string, string[]>()
  const originalTraceWidthBySourceTraceId = new Map<string, number>()
  for (const element of arduinoUnoCircuitJson) {
    if (element.type !== "pcb_trace" || !element.source_trace_id) continue
    const firstWirePoint = element.route.find(
      (point) => point.route_type === "wire",
    )
    if (
      firstWirePoint &&
      !originalTraceWidthBySourceTraceId.has(element.source_trace_id)
    ) {
      originalTraceWidthBySourceTraceId.set(
        element.source_trace_id,
        firstWirePoint.width,
      )
    }
    const routeSignatures =
      originalRouteSignaturesBySourceTraceId.get(element.source_trace_id) ?? []
    routeSignatures.push(routeSignature(element.route))
    originalRouteSignaturesBySourceTraceId.set(
      element.source_trace_id,
      routeSignatures,
    )
  }

  addArduinoUnoBoard({
    circuit: beforeRerouteCircuit,
    arduinoUnoCircuitJson,
    includeReroutePhase: false,
  })
  addArduinoUnoBoard({
    circuit: afterRerouteCircuit,
    arduinoUnoCircuitJson,
    includeReroutePhase: true,
  })

  await beforeRerouteCircuit.renderUntilSettled()
  await afterRerouteCircuit.renderUntilSettled()

  expect(afterRerouteCircuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(phaseInputs).toHaveLength(1)
  expect(phaseInputs[0]!.connections.length).toBeGreaterThan(0)
  for (const connection of phaseInputs[0]!.connections) {
    const sourceTraceId = getSourceTraceIdFromRerouteConnectionName(
      connection.name,
    )
    expect(originalTraceWidthBySourceTraceId.get(sourceTraceId)).toBeDefined()
    expect(connection.width).toBeUndefined()
    expect(connection.nominalTraceWidth).toBeUndefined()
  }

  const reroutedSourceTraceIds = new Set(
    phaseInputs[0]!.connections.map((connection) =>
      getSourceTraceIdFromRerouteConnectionName(connection.name),
    ),
  )
  const finalRouteSignatures = new Set(
    afterRerouteCircuit.db.pcb_trace
      .list()
      .map((trace) => routeSignature(trace.route)),
  )
  for (const sourceTraceId of reroutedSourceTraceIds) {
    for (const originalRouteSignature of originalRouteSignaturesBySourceTraceId.get(
      sourceTraceId,
    ) ?? []) {
      expect(finalRouteSignatures.has(originalRouteSignature)).toBe(false)
    }
  }

  const reroutedRegionTraces = afterRerouteCircuit.db.pcb_trace
    .list()
    .filter(
      (trace) =>
        trace.pcb_trace_id.includes("_reroute_") &&
        routeTouchesRegion(trace.route),
    )
  expect(reroutedRegionTraces.length).toBeGreaterThanOrEqual(
    phaseInputs[0]!.connections.length,
  )
  for (const trace of reroutedRegionTraces) {
    const sourceTraceId = getSourceTraceIdFromRerouteConnectionName(
      trace.source_trace_id ?? trace.pcb_trace_id,
    )
    const originalTraceWidth =
      originalTraceWidthBySourceTraceId.get(sourceTraceId)
    const firstWirePoint = trace.route.find(
      (point) => point.route_type === "wire",
    )
    if (originalTraceWidth !== undefined && firstWirePoint) {
      expect(
        Math.abs(firstWirePoint.width - originalTraceWidth),
      ).toBeGreaterThan(0.005)
    }
  }

  const noteRect = afterRerouteCircuit.db.pcb_note_rect.list()[0]
  expect(noteRect?.center.x).toBeCloseTo(rerouteRegionCenter.x)
  expect(noteRect?.center.y).toBeCloseTo(rerouteRegionCenter.y)
  expect(noteRect?.width).toBeCloseTo(rerouteRegion.maxX - rerouteRegion.minX)
  expect(noteRect?.height).toBeCloseTo(rerouteRegion.maxY - rerouteRegion.minY)
  expect(afterRerouteCircuit.db.pcb_note_text.list()).toHaveLength(1)

  const stackedComparisonSvg = stackSvgsHorizontally(
    [
      createLabeledPanelSvg(
        "LEFT: IMPORTED ARDUINO UNO",
        convertCircuitJsonToPcbSvg(beforeRerouteCircuit.getCircuitJson()),
      ),
      createLabeledPanelSvg(
        "RIGHT: REROUTED REGION",
        convertCircuitJsonToPcbSvg(afterRerouteCircuit.getCircuitJson()),
      ),
    ],
    {
      gap: 16,
      normalizeSize: false,
      rootAttributes: {
        "data-testid": "arduino-uno-reroute-left-right-stack",
      },
    },
  )
  expect(stackedComparisonSvg).toMatchSvgSnapshot(
    import.meta.path,
    "repro116-arduino-uno-reroute-left-right",
  )
  expect(afterRerouteCircuit).toMatchPcbSnapshot(import.meta.path)
}, 20_000)
