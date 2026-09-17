import { expect, test } from "bun:test"
import { Fragment } from "react"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Route between through-vias on inner1, retaining the router's connectsTo IDs.
 * Positions use the right-handed board-world frame in mm: +X right, +Y top,
 * +Z above the board. Layers locate points on Z; no transform is applied.
 */
async function routeViaConnectionsOnInnerLayer(
  srj: SimpleRouteJson,
): Promise<SimplifiedPcbTrace[]> {
  // The named traces cover the same pairs as the net-level connections.
  return srj.connections
    .filter((connection) => connection.source_trace_id)
    .map((connection, index) => ({
      type: "pcb_trace",
      pcb_trace_id: `inner_layer_route_${index}`,
      connectsTo: connection.pointsToConnect.map((point) => point.pcb_port_id!),
      // Endpoint port IDs are carried by connectsTo, not by the wire points.
      route: connection.pointsToConnect.map(({ x, y }) => ({
        route_type: "wire",
        layer: "inner1",
        width: 0.2,
        x,
        y,
      })),
    }))
}

test("inner-layer routes retain the distinct nets of their through-via endpoints", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={12}
      height={12}
      layers={4}
      autorouter={{
        algorithmFn: createBasicAutorouter(routeViaConnectionsOnInnerLayer),
      }}
    >
      <pcbnotetext
        text="Top-layer via ports connected by inner1 traces"
        pcbY={5}
        fontSize={0.36}
      />
      <pcbnotetext
        text="Each route should retain its source net"
        pcbY={4.3}
        fontSize={0.3}
      />
      {["GND", "SIGNAL"].map((net, row) => (
        <Fragment key={net}>
          <net name={net} />
          {["A", "B"].map((end, column) => (
            <Fragment key={end}>
              <via
                name={`${net}_${end}`}
                pcbX={column * 4 - 2}
                pcbY={row * 4 - 2}
                fromLayer="top"
                toLayer="bottom"
                outerDiameter={0.6}
                holeDiameter={0.3}
                connectsTo={`net.${net}`}
              />
            </Fragment>
          ))}
          <trace name={net} from={`.${net}_A > .top`} to={`.${net}_B > .top`} />
          <pcbnotetext
            text={`${net}: inner1 via-to-via route`}
            pcbY={row * 4 - 0.8}
            fontSize={0.4}
          />
        </Fragment>
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()

  const { db } = circuit
  const sourceTraces = ["GND", "SIGNAL"].map(
    (name) => db.source_trace.list().find((trace) => trace.name === name)!,
  )
  const pcbTraces = db.pcb_trace.list()
  const routeAttributions = sourceTraces.map((sourceTrace) => {
    const viaPorts = sourceTrace.connected_source_port_ids.map(
      (sourcePortId) =>
        db.pcb_port
          .list()
          .find((port) => port.source_port_id === sourcePortId)!,
    )
    const pcbTrace = pcbTraces.find((trace) =>
      trace.route.some(
        (point) =>
          point.route_type === "wire" &&
          point.x === viaPorts[0].x &&
          point.y === viaPorts[0].y,
      ),
    )!
    return { sourceTrace, viaPorts, pcbTrace }
  })

  // Draw the attribution actually emitted by core. The copper geometry is
  // unchanged by this bug, so static net labels alone cannot expose it.
  const annotatedCircuitJson = circuit.getCircuitJson().map((element) => {
    if (element.type !== "pcb_note_text") return element
    const attribution = routeAttributions.find(
      ({ sourceTrace }) =>
        element.text === `${sourceTrace.name}: inner1 via-to-via route`,
    )
    if (!attribution) return element
    const { sourceTrace, pcbTrace } = attribution
    const assignedSourceTrace = pcbTrace.source_trace_id
      ? db.source_trace.get(pcbTrace.source_trace_id)
      : undefined
    return {
      ...element,
      text: `Expected ${sourceTrace.name}; actual ${assignedSourceTrace?.name ?? "UNASSIGNED"}`,
    }
  })
  await expect(annotatedCircuitJson).toMatchPcbSnapshot(import.meta.path, {
    layer: "inner1",
  })

  expect(pcbTraces).toHaveLength(2)
  // Geometry cannot identify these endpoints: the logical via ports are on top.
  for (const { sourceTrace, viaPorts, pcbTrace } of routeAttributions) {
    expect(viaPorts.every((port) => port.layers.includes("top"))).toBe(true)
    expect(viaPorts.every((port) => !port.layers.includes("inner1"))).toBe(true)
    expect(pcbTrace.source_trace_id).toBe(sourceTrace.source_trace_id)
  }
  expect(sourceTraces[0].subcircuit_connectivity_map_key).not.toBe(
    sourceTraces[1].subcircuit_connectivity_map_key,
  )
})
