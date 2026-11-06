import { expect, test } from "bun:test"
import { fanoutTracePath } from "@tscircuit/props"
import type { AnyCircuitElement, PcbTrace } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import {
  M1ImonComponents,
  m1ImonRouterRoute,
} from "tests/fixtures/four-motor-usbc-m1-imon"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import "tests/fixtures/extend-expect-any-svg"

/**
 * Reproduction only: records the current failure, without correcting routes.
 * Core orients this real board route from U103 to R116 but leaves its via's
 * bottom->top fields unchanged. The saved-path schema then rejects the route.
 * When fixed, replace the rejection assertion and update the annotated snapshot.
 */
test("reproduces M1_IMON via direction becoming invalid after core reverses the route", async () => {
  const inputRoute = structuredClone(m1ImonRouterRoute)
  const inputValidation = fanoutTracePath.safeParse({
    connection: "R116.pin1",
    route: inputRoute,
  })
  expect(inputValidation.success).toBe(true)

  const { circuit } = getTestFixture()
  circuit.schematicDisabled = true
  let routerCalled = false
  circuit.add(
    <board
      width={174}
      height={99}
      layers={4}
      minTraceWidth={0.15}
      minViaHoleDiameter={0.3}
      minViaPadDiameter={0.6}
      autorouter={{
        algorithmFn: createBasicAutorouter(async (input) => {
          routerCalled = true
          expect(input.connections).toHaveLength(1)
          const connection = input.connections[0]!
          // Original JLCPCB pads must land exactly at the recorded endpoints.
          const endpoints = connection.pointsToConnect.map(
            ({ x, y, layer }) => ({
              x,
              y,
              layer,
            }),
          )
          expect(endpoints).toContainEqual({
            x: -71.0949853,
            y: -38.274956,
            layer: "top",
          })
          expect(endpoints).toContainEqual({
            x: -62.246636,
            y: -35,
            layer: "bottom",
          })
          return [
            {
              type: "pcb_trace",
              pcb_trace_id: "m1_imon_route",
              connection_name: connection.name,
              // Preserve the fixture: core may mutate the returned trace object.
              route: structuredClone(inputRoute),
            },
          ]
        }),
      }}
    >
      <M1ImonComponents />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(routerCalled).toBe(true)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  const outputTrace = circuit.db.pcb_trace.list()[0]!
  const outputValidation = fanoutTracePath.safeParse({
    connection: "U103.pin9",
    route: outputTrace.route,
  })

  expect(outputTrace.route[0]).toMatchObject(inputRoute.at(-1)!)
  expect(outputTrace.route.at(-1)).toMatchObject(inputRoute[0]!)
  const inputVia = inputRoute.find((point) => point.route_type === "via")!
  const outputVia = outputTrace.route.find(
    (point) => point.route_type === "via",
  )!
  expect(outputVia).toMatchObject({
    x: inputVia.x,
    y: inputVia.y,
    from_layer: "bottom",
    to_layer: "top",
    via_diameter: 0.6,
    via_hole_diameter: 0.3,
  })
  expect(circuit.db.pcb_via.list()).toHaveLength(1)
  expect(circuit.db.pcb_via.list()[0]).toMatchObject({
    x: inputVia.x,
    y: inputVia.y,
    outer_diameter: inputVia.via_diameter,
    hole_diameter: inputVia.via_hole_diameter,
  })
  expect(outputValidation.success).toBe(false)
  if (outputValidation.success)
    throw new Error("Expected the current via reversal defect")
  expect(outputValidation.error.issues.map(({ message }) => message)).toContain(
    "A fanout trace path must use vias for layer changes",
  )
  // This is a route-data/save failure, not missing physical copper: compare all
  // original positions, wire layers/widths and via dimensions after orientation.
  expect(outputTrace.route.map(copperPoint)).toEqual(
    inputRoute.toReversed().map(copperPoint),
  )

  const outputJson = circuit.getCircuitJson()
  const inputJson = outputJson.map((element) =>
    element.type === "pcb_trace" ? { ...element, route: inputRoute } : element,
  )
  await expect(
    comparisonSnapshot({
      inputJson,
      outputJson,
      inputVia,
      outputVia,
      inputValid: inputValidation.success,
      outputValid: outputValidation.success,
    }),
  ).toMatchSvgSnapshot(import.meta.path)
}, 30_000)

/** Board-world points, mm, +X right/+Y up/+Z above; unchanged physical layers. */
function copperPoint(
  point: PcbTrace["route"][number] | SimplifiedPcbTrace["route"][number],
) {
  if (point.route_type === "wire") {
    return { x: point.x, y: point.y, layer: point.layer, width: point.width }
  }
  if (point.route_type === "via") {
    return {
      x: point.x,
      y: point.y,
      layers: [point.from_layer, point.to_layer].sort(),
    }
  }
  throw new Error("The M1_IMON fixture contains only wires and one via")
}

type RouteVia = Extract<
  SimplifiedPcbTrace["route"][number],
  { route_type: "via" }
>

/**
 * Two PCB crops, not schematics. Circuit geometry remains in board-world mm.
 * The outer SVG uses screen pixels (+X right, +Y down). circuit-to-svg alone
 * projects PCB points; the screen layout only places its rendered SVG panels.
 * Labels use the actual emitted via fields and actual schema validation results.
 */
function comparisonSnapshot({
  inputJson,
  outputJson,
  inputVia,
  outputVia,
  inputValid,
  outputValid,
}: {
  inputJson: AnyCircuitElement[]
  outputJson: AnyCircuitElement[]
  inputVia: RouteVia
  outputVia: RouteVia
  inputValid: boolean
  outputValid: boolean
}) {
  const pcbPanel = (json: AnyCircuitElement[], prefix: string) =>
    convertCircuitJsonToPcbSvg(json, {
      width: 720,
      height: 370,
      viewport: { minX: -76, maxX: -59, minY: -42, maxY: -32 },
      shouldDrawRatsNest: false,
      shouldDrawErrors: false,
      showCourtyards: false,
      includeVersion: false,
      colorOverrides: {
        copper: { top: "#f28c66", bottom: "#71b7ff" },
      },
    })
      .replace(/id="([^"]+)"/g, `id="${prefix}-$1"`)
      .replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`)
  const direction = (via: RouteVia) =>
    `${via.from_layer.toUpperCase()} → ${via.to_layer.toUpperCase()}`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1020" viewBox="0 0 1600 1020">
    <rect width="1600" height="1020" fill="#101827"/>
    <g font-family="Arial, sans-serif" fill="#f3f6fb">
      <text x="50" y="58" font-size="32" font-weight="bold">M1_IMON: core reverses the route, but not the via direction</text>
      <text x="50" y="98" font-size="21" fill="#bac8db">Real 4-Motor USB-C motherboard extract · U103 / TPS259470LRPWR · R116 / 1 kΩ</text>
      <text x="50" y="130" font-size="19" fill="#bac8db">Original pads, positions and copper. Orange = top. Blue = bottom. Pink-centered ring = via.</text>

      <rect x="30" y="160" width="760" height="705" rx="14" fill="#19253a" stroke="#39516b"/>
      <rect x="810" y="160" width="760" height="705" rx="14" fill="#19253a" stroke="#39516b"/>
      <text x="60" y="205" font-size="26" font-weight="bold">1. ROUTER INPUT</text>
      <text x="840" y="205" font-size="26" font-weight="bold">2. CORE OUTPUT — CURRENT BUG</text>
      <text x="60" y="245" font-size="22">Route order: R116 (bottom) → U103 (top)</text>
      <text x="840" y="245" font-size="22">Route order: U103 (top) → R116 (bottom)</text>
      <g transform="translate(50 270)">${pcbPanel(inputJson, "input")}</g>
      <g transform="translate(830 270)">${pcbPanel(outputJson, "output")}</g>

      <text x="60" y="685" font-size="25" fill="#76e0b1">Via says: ${direction(inputVia)}</text>
      <text x="840" y="685" font-size="25" fill="#ff9b9b">Via still says: ${direction(outputVia)}</text>
      <text x="60" y="725" font-size="21">Matches the route's point order.</text>
      <text x="840" y="725" font-size="21">Wrong for this traversal: it needs TOP → BOTTOM.</text>
      <text x="60" y="780" font-size="26" font-weight="bold" fill="#76e0b1">Saved-path validation: ${inputValid ? "PASS" : "FAIL"}</text>
      <text x="840" y="780" font-size="26" font-weight="bold" fill="#ff9b9b">Saved-path validation: ${outputValid ? "PASS" : "FAIL"}</text>
      <text x="840" y="819" font-size="18" fill="#ffbaba">“A fanout trace path must use vias for layer changes”</text>

      <text x="50" y="919" font-size="25" font-weight="bold">The copper looks the same because its physical geometry IS the same.</text>
      <text x="50" y="960" font-size="22" fill="#bac8db">The failure is inconsistent via direction in saved PCB route data. This PR reproduces it; no fix is applied.</text>
    </g>
  </svg>`
}
