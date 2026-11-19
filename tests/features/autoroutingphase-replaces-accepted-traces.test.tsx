import { expect, test } from "bun:test"
import type { PcbTrace, PcbVia } from "circuit-json"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

function routeWithVia({
  simpleRouteJson,
  reroute,
}: {
  simpleRouteJson: SimpleRouteJson
  reroute: boolean
}): SimplifiedPcbTrace[] {
  return simpleRouteJson.connections.map((connection) => {
    const [start, end] = connection.pointsToConnect
    const viaX = (start.x + end.x) / 2 + (reroute ? 1 : 0)
    return {
      type: "pcb_trace",
      pcb_trace_id: `${connection.name}_${reroute ? "replacement" : "original"}`,
      connection_name: connection.source_trace_id ?? connection.name,
      route: [
        { route_type: "wire", ...start, width: 0.15 },
        {
          route_type: "wire",
          x: viaX,
          y: start.y,
          layer: start.layer,
          width: 0.15,
        },
        {
          route_type: "via",
          x: viaX,
          y: start.y,
          from_layer: start.layer,
          to_layer: end.layer,
        },
        {
          route_type: "wire",
          x: viaX,
          y: start.y,
          layer: end.layer,
          width: 0.15,
        },
        { route_type: "wire", ...end, width: 0.15 },
      ],
    }
  })
}

test("a later phase replaces published copper and keeps it after a routing error", async () => {
  const { circuit } = getTestFixture()
  const lastPhaseStarted = Promise.withResolvers<void>()
  const releaseLastPhase = Promise.withResolvers<void>()
  let originalPcbTraceId: PcbTrace["pcb_trace_id"] | undefined
  let originalPcbViaId: PcbVia["pcb_via_id"] | undefined

  circuit.add(
    <board width={16} height={12} schematicDisabled>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} pcbY={2} />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={5}
        pcbY={2}
        layer="bottom"
      />
      <resistor
        name="R3"
        resistance="1k"
        footprint="0402"
        pcbX={-5}
        pcbY={-2}
      />
      <resistor name="R4" resistance="1k" footprint="0402" pcbX={5} pcbY={-2} />
      <pcbnotetext text="Accepted replacement: one via" pcbX={0} pcbY={4} />
      <pcbnotetext
        text="Later phase fails; accepted copper remains"
        pcbX={0}
        pcbY={-4}
        fontSize={0.5}
      />
      <autoroutingphase
        phaseIndex={0}
        algorithmFn={createBasicAutorouter(async (simpleRouteJson) =>
          routeWithVia({ simpleRouteJson, reroute: false }),
        )}
      />
      <autoroutingphase
        phaseIndex={1}
        reroute
        connection="R1.pin1"
        algorithmFn={createBasicAutorouter(async (simpleRouteJson) => {
          originalPcbTraceId = circuit.db.pcb_trace.list()[0]?.pcb_trace_id
          originalPcbViaId = circuit.db.pcb_via.list()[0]?.pcb_via_id
          return routeWithVia({ simpleRouteJson, reroute: true })
        })}
      />
      <autoroutingphase
        phaseIndex={2}
        algorithmFn={createBasicAutorouter(async () => {
          lastPhaseStarted.resolve()
          await releaseLastPhase.promise
          throw new Error("The last phase intentionally fails")
        })}
      />
      <trace from="R1.pin1" to="R2.pin1" routingPhaseIndex={0} />
      <trace from="R3.pin1" to="R4.pin1" routingPhaseIndex={2} />
    </board>,
  )

  circuit.on("autorouting:error", ({ error }) => {
    lastPhaseStarted.reject(new Error(error.message))
  })
  const rendering = circuit.renderUntilSettled().then(() => {
    lastPhaseStarted.reject(
      new Error("Routing settled before the held phase started"),
    )
  })
  try {
    await lastPhaseStarted.promise
    expect(originalPcbTraceId).toBeDefined()
    expect(originalPcbViaId).toBeDefined()
    expect(circuit.db.pcb_trace.list()).toHaveLength(1)
    expect(circuit.db.pcb_via.list()).toHaveLength(1)
    expect(circuit.db.pcb_trace.list()[0].pcb_trace_id).not.toBe(
      originalPcbTraceId,
    )
    expect(circuit.db.pcb_via.list()[0].pcb_via_id).not.toBe(originalPcbViaId)
    expect(circuit.isDoneRendering()).toBeFalse()
    await expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
  } finally {
    releaseLastPhase.resolve()
    await rendering
  }

  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(1)
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.pcb_via.list()).toHaveLength(1)
  expect(circuit.db.pcb_trace.list()[0].pcb_trace_id).not.toBe(
    originalPcbTraceId,
  )
})
