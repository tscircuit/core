import { expect, test } from "bun:test"
import { Group } from "lib/components/primitive-components/Group/Group"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("accepted phase traces render while the next routing phase is pending", async () => {
  const { circuit } = getTestFixture()
  const secondPhaseStarted = Promise.withResolvers<void>()
  const releaseSecondPhase = Promise.withResolvers<void>()
  let firstPhaseTraces: SimplifiedPcbTrace[] = []
  let firstPhaseSnapshot: SimplifiedPcbTrace[] = []
  let renderingSettled = false
  let secondPhaseInputTraces: SimplifiedPcbTrace[] | undefined
  circuit.on("autorouting:error", ({ error }) => {
    secondPhaseStarted.reject(new Error(error.message))
  })

  const routePhase = createBasicAutorouter(async (simpleRouteJson) => {
    const traces = simpleRouteJson.connections.map(
      (connection): SimplifiedPcbTrace => ({
        type: "pcb_trace",
        pcb_trace_id: `${connection.name}_routed`,
        connection_name: connection.source_trace_id ?? connection.name,
        route: connection.pointsToConnect.map((point) => ({
          route_type: "wire",
          x: point.x,
          y: point.y,
          width: 0.15,
          layer: point.layer,
        })),
      }),
    )
    if (firstPhaseTraces.length === 0) {
      const [start, end] = traces[0].route
      if (start.route_type !== "wire" || end.route_type !== "wire") {
        throw new Error("The first phase needs two pad endpoints")
      }
      const viaX = (start.x + end.x) / 2
      traces[0].route = [
        start,
        { ...start, x: viaX - 1 },
        {
          route_type: "via",
          x: viaX - 1,
          y: start.y,
          from_layer: "top",
          to_layer: "bottom",
        },
        { ...start, x: viaX - 1, layer: "bottom" },
        { ...end, x: viaX + 1, layer: "bottom" },
        {
          route_type: "via",
          x: viaX + 1,
          y: end.y,
          from_layer: "bottom",
          to_layer: "top",
        },
        { ...end, x: viaX + 1 },
        end,
      ]
      firstPhaseTraces = traces
      firstPhaseSnapshot = structuredClone(traces)
    } else {
      secondPhaseInputTraces = structuredClone(simpleRouteJson.traces)
      secondPhaseStarted.resolve()
      await releaseSecondPhase.promise
    }
    return traces
  })

  circuit.add(
    <board width={16} height={12} schematicDisabled>
      <subcircuit name="PHASED">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-5}
          pcbY={2}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={5}
          pcbY={2}
        />
        <resistor
          name="R3"
          resistance="1k"
          footprint="0402"
          pcbX={-5}
          pcbY={-2}
        />
        <resistor
          name="R4"
          resistance="1k"
          footprint="0402"
          pcbX={5}
          pcbY={-2}
        />
        <pcbnotetext text="Accepted phase: R1 to R2" pcbX={0} pcbY={4} />
        <pcbnotetext text="Routing continues: R3 to R4" pcbX={0} pcbY={-4} />
        <autoroutingphase
          phaseIndex={0}
          name="accepted"
          algorithmFn={routePhase}
        />
        <autoroutingphase
          phaseIndex={1}
          name="pending"
          algorithmFn={routePhase}
        />
        <trace from=".R1 > .pin1" to=".R2 > .pin1" routingPhaseIndex={0} />
        <trace from=".R3 > .pin1" to=".R4 > .pin1" routingPhaseIndex={1} />
      </subcircuit>
    </board>,
  )

  const rendering = circuit.renderUntilSettled().then(() => {
    renderingSettled = true
    secondPhaseStarted.reject(
      new Error("Routing settled before the held phase started"),
    )
  })
  try {
    await secondPhaseStarted.promise
    const board = circuit.firstChild
    if (!(board instanceof Group)) {
      throw new Error("Expected the circuit's board")
    }
    const child = board
      ._findDirectChildSubcircuits()
      .find((subcircuit) => subcircuit.name === "PHASED")
    if (!child) {
      throw new Error("Expected a board containing the phased subcircuit")
    }
    expect(child._asyncAutoroutingResult).toBeNull()
    expect(board._areChildSubcircuitsRouted()).toBeFalse()
    expect(secondPhaseInputTraces).toEqual(firstPhaseSnapshot)
    expect(renderingSettled).toBeFalse()
    expect(circuit.isDoneRendering()).toBeFalse()
    expect(firstPhaseTraces).toEqual(firstPhaseSnapshot)
    await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
    expect(circuit.db.pcb_trace.list()).toHaveLength(1)
    expect(circuit.db.pcb_via.list()).toHaveLength(2)
    const acceptedCircuitJson = structuredClone(circuit.getCircuitJson())
    circuit.render()
    expect(circuit.getCircuitJson()).toEqual(acceptedCircuitJson)
  } finally {
    releaseSecondPhase.resolve()
    await rendering
  }

  expect(circuit.isDoneRendering()).toBeTrue()
  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(circuit.db.pcb_via.list()).toHaveLength(2)
})
