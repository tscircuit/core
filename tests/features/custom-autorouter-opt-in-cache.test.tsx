import { expect, test } from "bun:test"
import { withAutorouterCache } from "lib/utils/autorouting/with-autorouter-cache"
import type { AutoroutingEndEvent, AutoroutingStartEvent } from "lib/events"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "../fixtures/createBasicAutorouter"
import { getTestFixture } from "../fixtures/get-test-fixture"

test("custom cache identities preserve branched copper and transformed handoffs", async () => {
  const cache = new Map<string, string>()
  let calls = 0
  let output: SimpleRouteJson | undefined
  const base = createBasicAutorouter(async (input) => {
    calls++
    const traces: SimplifiedPcbTrace[] = input.connections.map(
      (connection, i) => {
        const [start, end] = connection.pointsToConnect
        const width = connection.nominalTraceWidth ?? input.minTraceWidth
      /** PCB board-space points in mm: +X right, +Y up; no frame transformation. */
        const wire = (x: number, y: number, layer: string) => ({
          route_type: "wire" as const,
          x,
          y,
          layer,
          width,
        })
      /** Same PCB frame, at a point; TOP is above BOTTOM along the Z axis. */
      const via = (
          x: number,
          y: number,
          from_layer: string,
          to_layer: string,
        ) => ({
          route_type: "via" as const,
          x,
          y,
          from_layer,
          to_layer,
          via_diameter: 0.6,
          via_hole_diameter: 0.3,
        })
        const junctionX = start.x + 1
        return {
          type: "pcb_trace",
          pcb_trace_id: `custom_${connection.name}`,
          connection_name: connection.name,
          route: [
            ...(i === 0
              ? [
                  wire(start.x, start.y, "top"),
                  wire(junctionX, start.y, "top"),
                  via(junctionX, start.y, "top", "bottom"),
                ]
              : []),
            wire(junctionX, start.y, "bottom"),
            wire(junctionX, end.y, "bottom"),
            wire(end.x - 1, end.y, "bottom"),
            via(end.x - 1, end.y, "bottom", "top"),
            wire(end.x - 1, end.y, "top"),
            wire(end.x, end.y, "top"),
          ],
        }
      },
    )
    output = {
      ...input,
      traces,
      connections: input.connections.map((connection) => ({
        ...connection,
        pointsToConnect: connection.pointsToConnect.map((point, i) => ({
          ...point,
          x: point.x + (i === 0 ? 1 : -1),
          layer: "bottom",
        })),
      })),
    }
    return traces
  })
  const algorithm = Object.freeze(async (input: SimpleRouteJson) => ({
    ...(await base(input)),
    getOutputSimpleRouteJson: () => output,
  }))
  const v1 = withAutorouterCache(algorithm, "branched-router-v1")
  const render = async (algorithmFn = v1, moved = false) => {
    const { circuit } = getTestFixture({
      platform: {
        localCacheEngine: {
          getItem: (key) => cache.get(key) ?? null,
          setItem: (key, value) => {
            cache.set(key, value)
          },
        },
      },
    })
    const starts: AutoroutingStartEvent[] = [],
      ends: AutoroutingEndEvent[] = []
    circuit.on("autorouting:start", (event) => starts.push(event))
    circuit.on("autorouting:end", (event) => ends.push(event))
    circuit.add(
      <board width={20} height={12} autorouter={{ algorithmFn }}>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-5}
          pcbRotation={180}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={moved ? 6 : 5}
        />
        <resistor
          name="R3"
          resistance="1k"
          footprint="0402"
          pcbX={5}
          pcbY={3}
        />
        <trace name="MAIN" from="R1.1" to="R2.1" />
        <trace name="BRANCH" from="R1.1" to="R3.1" />
        <pcbnotetext
          text="Cache retains a shared via junction and native handoffs"
          pcbY={5}
          fontSize={0.4}
        />
      </board>,
    )
    await circuit.renderUntilSettled()
    return { circuit, starts, ends }
  }
  const uncachedCold = await render(algorithm)
  const uncachedWarm = await render(algorithm)
  expect(calls).toBe(2)
  expect(uncachedCold.starts[0].cacheDisabledReason).toBe("custom_algorithm")
  expect(uncachedWarm.starts[0].cacheDisabledReason).toBe("custom_algorithm")
  calls = 0
  const cold = await render(),
    warm = await render()
  console.log(
    "CUSTOM_CACHE_PAIR_BENCHMARK",
    JSON.stringify({
      uncachedRenders: 2,
      uncachedSolverInvocations: 2,
      cachedRenders: 2,
      cachedSolverInvocations: calls,
    }),
  )
  expect(calls).toBe(1)
  expect([cold.starts[0]?.cacheStatus, warm.starts[0]?.cacheStatus]).toEqual([
    "miss",
    "hit",
  ])
  expect(warm.ends[0].simpleRouteJson).toEqual(cold.ends[0].simpleRouteJson)
  expect(
    warm.ends[0].simpleRouteJson.connections.every((connection) =>
      connection.pointsToConnect.every((point) => point.layer === "bottom"),
    ),
  ).toBe(true)
  expect(cold.circuit.db.pcb_trace.list()).toEqual(
    uncachedCold.circuit.db.pcb_trace.list(),
  )
  expect(warm.circuit.db.pcb_trace.list()).toEqual(
    cold.circuit.db.pcb_trace.list(),
  )
  expect(warm.circuit.db.pcb_via.list()).toEqual(cold.circuit.db.pcb_via.list())
  expect(warm.circuit).toMatchPcbSnapshot(import.meta.path)
  const changedIdentity = await render(
    withAutorouterCache(algorithm, "branched-router-v2"),
  )
  expect(changedIdentity.starts[0].cacheStatus).toBe("miss")
  expect(calls).toBe(2)
  const changedInput = await render(v1, true)
  expect(changedInput.starts[0].cacheStatus).toBe("miss")
  expect(calls).toBe(3)
  const bypassed = await render(algorithm)
  expect(bypassed.starts[0].cacheDisabledReason).toBe("custom_algorithm")
  expect(calls).toBe(4)
  console.log(
    "CUSTOM_CACHE_BENCHMARK",
    JSON.stringify({
      renders: 7,
      solverInvocations: calls + 2,
      cacheHitSolverInvocations: 0,
      invalidatedOnIdentityAndInput: true,
    }),
  )
}, 60_000)
