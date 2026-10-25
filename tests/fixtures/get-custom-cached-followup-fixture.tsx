import type { AutoroutingStartEvent, AutoroutingEndEvent } from "lib/events"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import { withAutorouterCache } from "lib/utils/autorouting/with-autorouter-cache"
import { createBasicAutorouter } from "./createBasicAutorouter"
import { RootCircuit } from "lib/RootCircuit"
import "lib/register-catalogue"

/** Synthetic routing in PCB world mm: +X right, +Y up, +Z above; right handed.
 * The first stage emits points, not directions, without a frame transform. */
export function getCustomCachedFollowupFixture(failFollowUpOnce = false) {
  const cache = new Map<string, string>()
  let firstStageCalls = 0,
    followUpCalls = 0
  let firstStageTraces: SimplifiedPcbTrace[] = []
  const partial = async (input: SimpleRouteJson) => {
    firstStageCalls++
    const connection = input.connections[0]!,
      start = connection.pointsToConnect[0]!
    const exit = {
      ...start,
      x: start.x + 1,
      pcb_port_id: undefined,
      pointId: "custom_exit",
    }
    const traces: SimplifiedPcbTrace[] = [
      {
        type: "pcb_trace",
        pcb_trace_id: "custom_prefix",
        connection_name: connection.name,
        source_trace_id: connection.source_trace_id,
        route: [start, exit].map((p) => ({
          route_type: "wire",
          x: p.x,
          y: p.y,
          layer: p.layer,
          width: input.minTraceWidth,
        })),
      },
    ]
    firstStageTraces = structuredClone(traces)
    const basic = await createBasicAutorouter(async () => traces)(input)
    return {
      ...basic,
      getOutputSimpleRouteJson: () => ({
        ...input,
        traces,
        connections: [
          {
            ...connection,
            pointsToConnect: [exit, ...connection.pointsToConnect.slice(1)],
          },
        ],
      }),
    }
  }
  const followUp = async (input: SimpleRouteJson) => {
    followUpCalls++
    if (failFollowUpOnce) {
      failFollowUpOnce = false
      return createBasicAutorouter(async () => {
        throw new Error("Synthetic follow-up failure")
      })(input)
    }
    return new TscircuitAutorouter(input)
  }
  const algorithmFn = withAutorouterCache(partial, "custom_prefix_v1", {
    followUpAutorouter: { algorithmFn: followUp },
  })
  const render = async (control = false) => {
    const circuit = new RootCircuit({
      platform: {
        partsEngineDisabled: true,
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
    circuit.on("autorouting:start", (e) => starts.push(e))
    circuit.on("autorouting:end", (e) => ends.push(e))
    circuit.add(
      <board
        width={16}
        height={8}
        layers={4}
        autorouter={
          control ? "auto_local" : { preset: "bus_lanes", algorithmFn }
        }
      >
        <pcbnotetext
          text="Cached custom prefix + native follow-up"
          pcbY={2.5}
          fontSize={0.45}
        />
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={-4}
          pcbRotation={180}
        />
        <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} />
        <trace from="R1.pin1" to="R2.pin1" />
      </board>,
    )
    await circuit.renderUntilSettled()
    return {
      circuit,
      starts,
      ends,
      rows: circuit.getCircuitJson(),
      firstStageCalls,
      followUpCalls,
      firstStageTraces,
    }
  }
  return { render }
}
