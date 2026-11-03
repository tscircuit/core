import { expect, test } from "bun:test"
import {
  validateOriginalEndpointConnectivity,
  validateRoutedCopperDrc,
} from "@tscircuit/fanout-solver"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "@tscircuit/capacity-autorouter"
import { getObstaclesFromCircuitJson } from "lib/utils/obstacles/getObstaclesFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("native DRC accepts clear copper beside a rounded pad without Circuit JSON metadata", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={6} height={4} routingDisabled schematicDisabled>
      <chip
        name="U1"
        pinLabels={{ pin1: "PAD" }}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width={3}
              height={2}
              cornerRadius={0.5}
              portHints={["pin1"]}
            />
          </footprint>
        }
      />
      <pcbnotetext
        text="0.04 mm wire beside R0.5 corner"
        pcbY={-1.6}
        fontSize={0.25}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const circuitJson = circuit.getCircuitJson()
  // Routers consume only SRJ geometry. Provenance is deliberately removed.
  const obstacles = getObstaclesFromCircuitJson(circuitJson).map(
    ({ circuitJsonMetadata, ...obstacle }) => obstacle,
  )
  const inputSrj: SimpleRouteJson = {
    layerCount: 2,
    minTraceWidth: 0.04,
    bounds: { minX: -3, maxX: 3, minY: -2, maxY: 2 },
    obstacles,
    connections: [
      {
        name: "CORNER_SIGNAL",
        pointsToConnect: [
          { x: 1.44, y: 0.95, layer: "top" },
          { x: 1.46, y: 0.95, layer: "top" },
        ],
      },
    ],
  }
  const trace: SimplifiedPcbTrace = {
    type: "pcb_trace",
    pcb_trace_id: "corner_signal",
    connection_name: "CORNER_SIGNAL",
    route: inputSrj.connections[0].pointsToConnect.map((point) => ({
      route_type: "wire",
      x: point.x,
      y: point.y,
      layer: "top",
      width: 0.04,
    })),
  }
  const routedSrj = { ...inputSrj, traces: [trace] }
  const connectivity = validateOriginalEndpointConnectivity({
    inputSrj,
    routedSrj,
  })
  const drc = validateRoutedCopperDrc({ inputSrj, routedSrj, clearance: 0.05 })
  expect(connectivity.valid).toBe(true)
  expect(drc.issues).toEqual([])
  expect(drc.valid).toBe(true)
  await expect([...circuitJson, trace]).toMatchPcbSnapshot(import.meta.path)
})
