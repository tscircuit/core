import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const routeConnectionsDirectly = (
  simpleRouteJson: SimpleRouteJson,
): SimplifiedPcbTrace[] =>
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

test("a bus routing phase assigns its traces to that phase", async () => {
  const { circuit } = getTestFixture()
  const routedBusIdsByPhase: string[][] = []
  const routedConnectionCountsByPhase: number[] = []

  const createPhaseAutorouter = () =>
    createBasicAutorouter(async (simpleRouteJson: SimpleRouteJson) => {
      for (const bus of simpleRouteJson.buses ?? []) {
        expect(bus).not.toHaveProperty("routingPhaseIndex")
      }
      routedBusIdsByPhase.push(
        simpleRouteJson.buses?.map((bus) => bus.busId) ?? [],
      )
      routedConnectionCountsByPhase.push(simpleRouteJson.connections.length)

      return routeConnectionsDirectly(simpleRouteJson)
    })

  circuit.add(
    <board width="30mm" height="12mm">
      <autoroutingphase
        phaseIndex={0}
        autorouter={{
          local: true,
          groupMode: "subcircuit",
          algorithmFn: createPhaseAutorouter(),
        }}
      />
      <autoroutingphase
        phaseIndex={1}
        autorouter={{
          local: true,
          groupMode: "subcircuit",
          algorithmFn: createPhaseAutorouter(),
        }}
      />

      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-9} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={-6} />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={-3} />
      <resistor name="R4" resistance="1k" footprint="0402" pcbX={0} />
      <resistor name="R5" resistance="1k" footprint="0402" pcbX={3} />
      <resistor name="R6" resistance="1k" footprint="0402" pcbX={6} />
      <resistor name="R7" resistance="1k" footprint="0402" pcbX={9} />
      <resistor name="R8" resistance="1k" footprint="0402" pcbX={12} />

      <trace name="CONTROL0" from=".R1 > .pin1" to=".R2 > .pin1" />
      <trace name="CONTROL1" from=".R3 > .pin1" to=".R4 > .pin1" />
      <trace name="DATA0" from=".R5 > .pin1" to=".R6 > .pin1" />
      <trace name="DATA1" from=".R7 > .pin1" to=".R8 > .pin1" />

      <bus
        name="CONTROL"
        connections={["CONTROL0", "CONTROL1"]}
        routingPhaseIndex={0}
      />
      <bus name="DATA" connections={["DATA0", "DATA1"]} routingPhaseIndex={1} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(routedBusIdsByPhase).toEqual([["CONTROL"], ["DATA"]])
  expect(routedConnectionCountsByPhase).toEqual([2, 2])
})

test("a bus without a phase does not change its trace phases", async () => {
  const { circuit } = getTestFixture()
  const routedBusIdsByPhase: string[][] = []
  const routedConnectionCountsByPhase: number[] = []
  const routedBusConnectionCountsByPhase: number[] = []

  const createPhaseAutorouter = () =>
    createBasicAutorouter(async (simpleRouteJson: SimpleRouteJson) => {
      routedBusIdsByPhase.push(
        simpleRouteJson.buses?.map((bus) => bus.busId) ?? [],
      )
      routedConnectionCountsByPhase.push(simpleRouteJson.connections.length)
      routedBusConnectionCountsByPhase.push(
        simpleRouteJson.buses?.[0]?.connectionNames.length ?? 0,
      )
      return routeConnectionsDirectly(simpleRouteJson)
    })

  circuit.add(
    <board width="14mm" height="8mm">
      <autoroutingphase
        phaseIndex={0}
        autorouter={{
          local: true,
          groupMode: "subcircuit",
          algorithmFn: createPhaseAutorouter(),
        }}
      />
      <autoroutingphase
        phaseIndex={1}
        autorouter={{
          local: true,
          groupMode: "subcircuit",
          algorithmFn: createPhaseAutorouter(),
        }}
      />

      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={-2} />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={2} />
      <resistor name="R4" resistance="1k" footprint="0402" pcbX={5} />

      <trace
        name="DATA0"
        from=".R1 > .pin1"
        to=".R2 > .pin1"
        routingPhaseIndex={0}
      />
      <trace
        name="DATA1"
        from=".R3 > .pin1"
        to=".R4 > .pin1"
        routingPhaseIndex={1}
      />

      <bus name="DATA" connections={["DATA0", "DATA1"]} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(routedBusIdsByPhase).toEqual([["DATA"], ["DATA"]])
  expect(routedConnectionCountsByPhase).toEqual([1, 1])
  expect(routedBusConnectionCountsByPhase).toEqual([1, 1])
})
