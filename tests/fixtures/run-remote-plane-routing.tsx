import { serve } from "bun"
import type { AnyCircuitElement } from "circuit-json"
import { TscircuitAutorouter } from "lib/utils/autorouting/CapacityMeshAutorouter"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "./get-test-fixture"

type RemoteRoutingRequest = {
  input_circuit_json?: AnyCircuitElement[]
  input_simple_route_json?: SimpleRouteJson
}

export const runRemotePlaneRouting = async (
  serverMode: "solve-endpoint" | "job",
) => {
  const { circuit } = getTestFixture({
    platform: { allowLegacyAutorouters: true },
  })
  let routingRequest: RemoteRoutingRequest | undefined
  let autorouterInput: SimpleRouteJson | undefined
  let routedTraces: SimplifiedPcbTrace[] = []
  const server = serve({
    port: 0,
    async fetch(request) {
      const endpoint = new URL(request.url).pathname
      if (
        endpoint === "/autorouting/solve" ||
        endpoint === "/autorouting/jobs/create"
      ) {
        routingRequest = (await request.json()) as RemoteRoutingRequest
        autorouterInput =
          routingRequest.input_simple_route_json ??
          getSimpleRouteJsonFromCircuitJson({
            circuitJson: routingRequest.input_circuit_json!,
          }).simpleRouteJson
        routedTraces = new TscircuitAutorouter(autorouterInput).solveSync()
        if (endpoint === "/autorouting/solve") {
          return Response.json({
            autorouting_result: { output_pcb_traces: routedTraces },
          })
        }
        return Response.json({
          autorouting_job: { autorouting_job_id: "plane_repro" },
        })
      }
      if (endpoint === "/autorouting/jobs/get") {
        return Response.json({
          autorouting_job: { is_finished: true, has_error: false },
        })
      }
      if (endpoint === "/autorouting/jobs/get_output") {
        return Response.json({
          autorouting_job_output: { output_pcb_traces: routedTraces },
        })
      }
      return new Response("Not found", { status: 404 })
    },
  })

  try {
    circuit.add(
      <board
        width={20}
        height={12}
        layers={4}
        schematicDisabled
        autorouter={{
          serverUrl: `http://localhost:${server.port}`,
          serverMode,
        }}
      >
        <net name="GND" />
        <copperpour layer="inner1" connectsTo="net.GND" unbroken />
        <pcbnotetext
          pcbY={7}
          text="INNER1: GND PLANE / NO SIGNAL WIRES"
          fontSize={0.55}
          anchorAlignment="center"
        />
        <pcbnotetext
          pcbY={-7}
          text="THROUGH VIAS MAY CROSS THE PLANE"
          fontSize={0.55}
          anchorAlignment="center"
        />
        <chip
          name="J_TOP"
          pcbX={-6}
          pinLabels={{ pin1: "SIGNAL" }}
          footprint={
            <footprint>
              <smtpad portHints={["pin1"]} shape="rect" width={1} height={1} />
            </footprint>
          }
        />
        <chip
          name="J_BOTTOM"
          pcbX={6}
          layer="bottom"
          pinLabels={{ pin1: "SIGNAL" }}
          footprint={
            <footprint>
              <smtpad portHints={["pin1"]} shape="rect" width={1} height={1} />
            </footprint>
          }
        />
        <keepout shape="rect" width={1} height={12} pcbX={-2} layer="top" />
        <keepout shape="rect" width={1} height={12} pcbX={2} layer="bottom" />
        <trace from="J_TOP.pin1" to="J_BOTTOM.pin1" />
      </board>,
    )
    await circuit.renderUntilSettled()
    return {
      circuit,
      routingRequest: routingRequest!,
      autorouterInput: autorouterInput!,
    }
  } finally {
    server.stop(true)
  }
}
