import { expect, test } from "bun:test"
import "lib/register-catalogue"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getViaBoardLayers } from "lib/utils/getViaSpanLayers"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("board routingLayers reserves excluded layers so no traces route on inner1 while through-vias pass through", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="12mm"
      layers={4}
      routingLayers={["top", "inner2", "bottom"]}
    >
      <chip
        footprint="soic8"
        name="U1"
        pcbX={-5}
        pcbY={0}
        connections={{
          pin1: "U2.pin5",
          pin2: "U2.pin6",
          pin3: "U2.pin7",
          pin4: "U2.pin8",
          pin5: "U2.pin1",
          pin6: "U2.pin2",
          pin7: "U2.pin3",
          pin8: "U2.pin4",
        }}
      />
      <chip footprint="soic8" name="U2" pcbX={5} pcbY={0} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const subcircuitComponent = circuit.firstChild!
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit
      .getCircuitJson()
      .filter((elm) => elm.type !== "pcb_trace" && elm.type !== "pcb_via"),
    subcircuitComponent,
  })

  const inner1PourObstacles = simpleRouteJson.obstacles.filter(
    (obstacle) => obstacle.isCopperPour && obstacle.layers.includes("inner1"),
  )
  expect(inner1PourObstacles.length).toBeGreaterThan(0)
  expect(
    inner1PourObstacles.every((obstacle) => obstacle.connectedTo.length === 0),
  ).toBe(true)

  const traces = circuit.db.pcb_trace.list()
  expect(traces.length).toBe(8)

  const wireLayers = new Set(
    traces.flatMap((trace) =>
      trace.route
        .filter((pt) => pt.route_type === "wire")
        .map((pt) => pt.layer),
    ),
  )
  expect(wireLayers.has("inner1")).toBe(false)
  expect(wireLayers.has("inner2") || wireLayers.has("bottom")).toBe(true)

  const vias = circuit.db.pcb_via.list()
  expect(vias.length).toBeGreaterThan(0)
  expect(
    vias.every(
      (via) => via.layers.join(",") === getViaBoardLayers(4).join(","),
    ),
  ).toBe(true)
})

test("board planeLayers reserves inner1 for GND plane and allows GND escape vias + signal through-vias", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="20mm"
      height="12mm"
      layers={4}
      planeLayers={{ inner1: "GND" }}
    >
      <chip
        footprint="soic8"
        name="U1"
        pcbX={-5}
        pcbY={0}
        connections={{
          pin1: "U2.pin5",
          pin2: "U2.pin6",
          pin3: "net.GND",
          pin4: "U2.pin8",
          pin5: "U2.pin1",
          pin6: "U2.pin2",
        }}
      />
      <chip
        footprint="soic8"
        name="U2"
        pcbX={5}
        pcbY={0}
        connections={{
          pin7: "net.GND",
        }}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const subcircuitComponent = circuit.firstChild!
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit
      .getCircuitJson()
      .filter((elm) => elm.type !== "pcb_trace" && elm.type !== "pcb_via"),
    subcircuitComponent,
  })

  const gndNet = circuit.db.source_net.list().find((net) => net.name === "GND")
  expect(gndNet).toBeDefined()

  const inner1PourObstacles = simpleRouteJson.obstacles.filter(
    (obstacle) => obstacle.isCopperPour && obstacle.layers.includes("inner1"),
  )
  expect(inner1PourObstacles.length).toBeGreaterThan(0)
  expect(
    inner1PourObstacles.some((obstacle) =>
      obstacle.connectedTo.includes(gndNet!.source_net_id),
    ),
  ).toBe(true)

  const traces = circuit.db.pcb_trace.list()
  expect(traces.length).toBeGreaterThanOrEqual(5)

  const wireLayers = new Set(
    traces.flatMap((trace) =>
      trace.route
        .filter((pt) => pt.route_type === "wire")
        .map((pt) => pt.layer),
    ),
  )
  expect(wireLayers.has("inner1")).toBe(false)
  expect(wireLayers.has("inner2") || wireLayers.has("bottom")).toBe(true)
})

test("trace and net pcbAllowedLayers populate SimpleRouteJson allowedLayers and constrain routing layers", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm" layers={4}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={2} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={-2} />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0402"
        pcbX={-5}
        pcbY={-2}
      />
      <resistor name="R4" resistance="1k" footprint="0402" pcbX={5} pcbY={2} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbAllowedLayers={["top", "bottom"]}
      />
      <net
        name="SIG_OUTER"
        connectsTo={[".R3 > .pin2", ".R4 > .pin1"]}
        pcbAllowedLayers={["top", "bottom"]}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  const subcircuitComponent = circuit.firstChild!
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit
      .getCircuitJson()
      .filter((elm) => elm.type !== "pcb_trace" && elm.type !== "pcb_via"),
    subcircuitComponent,
  })

  expect(simpleRouteJson.connections.length).toBe(2)
  for (const conn of simpleRouteJson.connections) {
    expect(conn.allowedLayers).toEqual(["top", "bottom"])
  }

  const traces = circuit.db.pcb_trace.list()
  expect(traces.length).toBe(2)

  const wireLayers = new Set(
    traces.flatMap((trace) =>
      trace.route
        .filter((pt) => pt.route_type === "wire")
        .map((pt) => pt.layer),
    ),
  )
  expect(wireLayers.has("inner1")).toBe(false)
  expect(wireLayers.has("inner2")).toBe(false)
  expect(wireLayers.has("bottom")).toBe(true)
})

test("mixed pcbAllowedLayers traces route constrained traces on allowed layers while unconstrained traces can use inner layers", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="12mm" layers={4}>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={3} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={5} pcbY={-3} />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0402"
        pcbX={-5}
        pcbY={-3}
      />
      <resistor name="R4" resistance="1k" footprint="0402" pcbX={5} pcbY={3} />
      <resistor name="R5" resistance="1k" footprint="0402" pcbX={-5} pcbY={0} />
      <resistor name="R6" resistance="1k" footprint="0402" pcbX={5} pcbY={0} />
      <trace
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        pcbAllowedLayers={["top", "bottom"]}
      />
      <trace
        from=".R3 > .pin2"
        to=".R4 > .pin1"
        pcbAllowedLayers={["top", "bottom"]}
      />
      <trace from=".R5 > .pin2" to=".R6 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const traces = circuit.db.pcb_trace.list()
  expect(traces.length).toBe(3)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)

  const constrainedSourceTraces = circuit.db.source_trace
    .list()
    .filter(
      (st) =>
        st.display_name?.includes("R1") || st.display_name?.includes("R3"),
    )
  expect(constrainedSourceTraces.length).toBe(2)

  for (const st of constrainedSourceTraces) {
    const pcbTrace = traces.find(
      (t) => t.source_trace_id === st.source_trace_id,
    )
    expect(pcbTrace).toBeDefined()
    const traceWireLayers = new Set(
      pcbTrace!.route
        .filter((pt) => pt.route_type === "wire")
        .map((pt) => pt.layer),
    )
    expect(traceWireLayers.has("inner1")).toBe(false)
    expect(traceWireLayers.has("inner2")).toBe(false)
  }
})
