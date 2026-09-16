import { expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import { getSvgFromGraphicsObject, type GraphicsObject } from "graphics-debug"
import type { RoutingPhasePlan } from "lib/components/primitive-components/Group/GroupRoutingPhasePlan"
import {
  Group_filterSimpleRouteJsonForPhase,
  connectionIsInRoutingPhase,
} from "lib/components/primitive-components/Group/Group_phasedAutoroutingUtils"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { stackSvgsHorizontally, stackSvgsVertically } from "stack-svgs"

const createPanelLabelSvg = (label: string, subtitle: string): string => `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="700"
  height="70"
  viewBox="0 0 700 70"
>
  <rect width="700" height="70" fill="#f4f4f4" />
  <text x="350" y="26" fill="#111" font-family="Arial, sans-serif"
    font-size="18" font-weight="700" text-anchor="middle">${label}</text>
  <text x="350" y="51" fill="#4b5563" font-family="Arial, sans-serif"
    font-size="14" text-anchor="middle">${subtitle}</text>
</svg>`

const createLabeledConnectionSvg = (
  label: string,
  connections: SimpleRouteJson["connections"],
): string => {
  const localBreakout = connections.find(
    (connection) => connection.name === "breakout:pcb_breakout_point_11",
  )!
  const globalTail = connections.find(
    (connection) => connection.name === "source_trace_199",
  )
  const [componentPad, boundaryPoint] = localBreakout.pointsToConnect
  const remoteBoundaryPoint = globalTail?.pointsToConnect.find(
    (point) => point.pointId !== boundaryPoint.pointId,
  )
  const graphics: GraphicsObject = {
    rects: [
      {
        center: { x: 2.5, y: 16 },
        width: 7,
        height: 10,
        fill: "rgba(255,255,255,0)",
        stroke: "rgba(0,0,0,0)",
      },
      {
        center: { x: 4.7, y: 20.1 },
        width: 1.2,
        height: 1,
        fill: "#f3f4f6",
        stroke: "#4b5563",
        label: "LT8912B",
      },
    ],
    points: [
      { ...componentPad, color: "#dc2626", label: "HDMI pad" },
      { ...boundaryPoint, color: "#dc2626", label: "fanout boundary" },
      ...(remoteBoundaryPoint
        ? [
            {
              ...remoteBoundaryPoint,
              color: "#0891b2",
              label: "global boundary",
            },
          ]
        : []),
    ],
    lines: [
      {
        points: [componentPad, boundaryPoint],
        strokeColor: "#dc2626",
        strokeWidth: 0.12,
        label: "local fanout connection",
      },
      ...(remoteBoundaryPoint
        ? [
            {
              points: [boundaryPoint, remoteBoundaryPoint],
              strokeColor: "#0891b2",
              strokeWidth: 0.12,
              label: "global transit tail (wrong phase)",
            },
          ]
        : []),
    ],
  }
  const srjSvg = getSvgFromGraphicsObject(graphics, {
    backgroundColor: "#fff",
    hideInlineLabels: false,
    svgHeight: 560,
    svgWidth: 700,
  })
  const subtitle = remoteBoundaryPoint
    ? "RED local fanout + BLUE global tail are sent to one solver"
    : "RED local fanout only; the BLUE global tail runs in its own phase"
  return stackSvgsVertically([createPanelLabelSvg(label, subtitle), srjSvg], {
    gap: 0,
    normalizeSize: false,
  })
}

test("keeps a T113 global transit tail out of its paired fanout phase", () => {
  const fixtureUrl = new URL(
    "../fixtures/t113-linux-fanout-phase-transit/phase-input.srj.json.gz",
    import.meta.url,
  )
  const simpleRouteJson = JSON.parse(
    gunzipSync(readFileSync(fixtureUrl)).toString(),
  ) as SimpleRouteJson
  const globalTail = simpleRouteJson.connections.find(
    (connection) => connection.name === "source_trace_199",
  )
  const localBreakout = simpleRouteJson.connections.find(
    (connection) => connection.name === "breakout:pcb_breakout_point_11",
  )
  expect(globalTail).toBeDefined()
  expect(globalTail?.routingPcbGroupId).toBeUndefined()
  expect(localBreakout?.routingPcbGroupId).toBe("pcb_group_5")

  const phasePlan = {
    routingPhaseIndex: 5,
    routingPcbGroupId: "pcb_group_5",
    nets: [],
    traces: [{ source_trace_id: "source_trace_199" }],
  } as unknown as RoutingPhasePlan

  expect(connectionIsInRoutingPhase(globalTail!, phasePlan)).toBe(true)
  expect(connectionIsInRoutingPhase(localBreakout!, phasePlan)).toBe(true)

  const unfilteredPhaseInput = {
    ...simpleRouteJson,
    connections: simpleRouteJson.connections.filter((connection) =>
      connectionIsInRoutingPhase(connection, phasePlan),
    ),
  }

  const phaseInput = Group_filterSimpleRouteJsonForPhase(
    simpleRouteJson,
    phasePlan,
  )
  expect(
    phaseInput.connections.some(
      (connection) => connection.name === "source_trace_199",
    ),
  ).toBe(false)
  expect(
    phaseInput.connections.some(
      (connection) => connection.name === "breakout:pcb_breakout_point_11",
    ),
  ).toBe(true)
  expect(
    phaseInput.connections.every(
      (connection) => connection.routingPcbGroupId === "pcb_group_5",
    ),
  ).toBe(true)

  const initialPhaseInput = Group_filterSimpleRouteJsonForPhase(
    {
      ...simpleRouteJson,
      connections: simpleRouteJson.connections.filter(
        (connection) => connection !== localBreakout,
      ),
    },
    phasePlan,
  )
  expect(
    initialPhaseInput.connections.some(
      (connection) => connection.name === "source_trace_199",
    ),
  ).toBe(true)

  const comparisonSvg = stackSvgsHorizontally(
    [
      createLabeledConnectionSvg(
        "BEFORE · GLOBAL TAIL CLAIMED BY FANOUT",
        unfilteredPhaseInput.connections,
      ),
      createLabeledConnectionSvg(
        "AFTER · ONLY LOCAL PAD-TO-BOUNDARY ROUTE",
        phaseInput.connections,
      ),
    ],
    { gap: 16, normalizeSize: false },
  )
  expect(comparisonSvg).toMatchSvgSnapshot(import.meta.path)
})
