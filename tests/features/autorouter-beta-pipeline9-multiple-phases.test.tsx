import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createAutoroutingPhaseIoStack } from "tests/fixtures/create-autorouting-phase-io-stack"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const routeConnectionsDirectly = async (
  simpleRouteJson: SimpleRouteJson,
): Promise<SimplifiedPcbTrace[]> =>
  simpleRouteJson.connections.map(
    (connection): SimplifiedPcbTrace => ({
      type: "pcb_trace",
      pcb_trace_id: `${connection.name}_routed`,
      connection_name: connection.source_trace_id ?? connection.name,
      route: connection.pointsToConnect.map((point) => ({
        route_type: "wire",
        x: point.x,
        y: point.y,
        width: connection.nominalTraceWidth ?? 0.15,
        layer: point.layer,
      })),
    }),
  )

test("beta_pipeline9 routes a later phase around preloaded traces", async () => {
  const { circuit } = getTestFixture()
  const autoroutingPhaseIoStack = createAutoroutingPhaseIoStack(circuit)

  circuit.add(
    <board
      width="18mm"
      height="16mm"
      minTraceWidth="0.15mm"
      defaultTraceWidth="0.15mm"
      minTraceToPadEdgeClearance="0.15mm"
      minViaEdgeToPadEdgeClearance="0.15mm"
      minViaHoleEdgeToViaHoleEdgeClearance="0.15mm"
      minViaHoleDiameter="0.2mm"
      minViaPadDiameter="0.5mm"
    >
      <autoroutingphase
        phaseIndex={0}
        autorouter={{
          local: true,
          groupMode: "subcircuit",
          algorithmFn: createBasicAutorouter(routeConnectionsDirectly),
        }}
      />
      <autoroutingphase phaseIndex={1} autorouter="beta_pipeline9" />

      <resistor
        name="R1"
        resistance="1k"
        footprint="0402"
        pcbX={-6}
        pcbY={-1.5}
      />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={6}
        pcbY={-1.5}
      />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0402"
        pcbX={-6}
        pcbY={1.5}
      />
      <resistor
        name="R4"
        resistance="1k"
        footprint="0402"
        pcbX={6}
        pcbY={1.5}
      />

      <resistor
        name="R5"
        resistance="1k"
        footprint="0402"
        pcbX={-1.5}
        pcbY={-5}
        pcbRotation={90}
      />
      <resistor
        name="R6"
        resistance="1k"
        footprint="0402"
        pcbX={-1.5}
        pcbY={5}
        pcbRotation={90}
      />
      <resistor
        name="R7"
        resistance="1k"
        footprint="0402"
        pcbX={1.5}
        pcbY={-5}
        pcbRotation={90}
      />
      <resistor
        name="R8"
        resistance="1k"
        footprint="0402"
        pcbX={1.5}
        pcbY={5}
        pcbRotation={90}
      />

      <trace
        name="PHASE0_LOWER"
        from=".R1 > .pin2"
        to=".R2 > .pin1"
        routingPhaseIndex={0}
      />
      <trace
        name="PHASE0_UPPER"
        from=".R3 > .pin2"
        to=".R4 > .pin1"
        routingPhaseIndex={0}
      />
      <trace
        name="PHASE1_LEFT"
        from=".R5 > .pin2"
        to=".R6 > .pin1"
        routingPhaseIndex={1}
      />
      <trace
        name="PHASE1_RIGHT"
        from=".R7 > .pin2"
        to=".R8 > .pin1"
        routingPhaseIndex={1}
      />

      <pcbnotetext
        pcbX={0}
        pcbY={-7}
        fontSize={0.45}
        text="Pipeline9 phase 1 routes around preloaded phase 0 traces"
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_pad_trace_clearance_error.list()).toEqual([])
  expect(circuit.db.pcb_via_clearance_error.list()).toEqual([])

  expect(autoroutingPhaseIoStack).toHaveLength(2)
  expect(autoroutingPhaseIoStack[0]?.endSimpleRouteJson?.traces).toHaveLength(2)
  expect(autoroutingPhaseIoStack[1]?.startSimpleRouteJson?.traces).toHaveLength(
    2,
  )
  expect(autoroutingPhaseIoStack[1]?.endSimpleRouteJson?.traces).toHaveLength(4)
  const pcbTraces = circuit.db.pcb_trace.list()
  expect(pcbTraces).toHaveLength(4)
  expect(new Set(pcbTraces.map((trace) => trace.pcb_trace_id)).size).toBe(4)
  expect(circuit.db.pcb_via.list().length).toBeGreaterThanOrEqual(4)

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    diffThresholdPercent: 2,
  })
})
