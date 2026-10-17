import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

const importedCircuitJson = await renderToCircuitJson(
  <board>
    <resistor name="LEFT" resistance="1k" footprint="0402" pcbX={-5} />
    <resistor name="RIGHT" resistance="1k" footprint="0402" pcbX={5} />
    <trace from=".LEFT > .pin1" to=".RIGHT > .pin1" />
  </board>,
)

const importedTraceMidpointOffsetMm = 1

const createImportedTraceRerouter = (
  rerouteSimpleRouteJsonInputs: SimpleRouteJson[],
) =>
  createBasicAutorouter(async (simpleRouteJson: SimpleRouteJson) => {
    rerouteSimpleRouteJsonInputs.push(structuredClone(simpleRouteJson))

    return simpleRouteJson.connections.map((connection): SimplifiedPcbTrace => {
      const [startPoint, endPoint] = connection.pointsToConnect
      const traceWidthMm = connection.nominalTraceWidth ?? 0.15

      return {
        type: "pcb_trace",
        pcb_trace_id: `${connection.name}_unbounded_reroute`,
        connection_name: connection.source_trace_id ?? connection.name,
        route: [
          {
            route_type: "wire",
            x: startPoint!.x,
            y: startPoint!.y,
            width: traceWidthMm,
            layer: startPoint!.layer,
          },
          {
            route_type: "wire",
            x: (startPoint!.x + endPoint!.x) / 2,
            y:
              (startPoint!.y + endPoint!.y) / 2 + importedTraceMidpointOffsetMm,
            width: traceWidthMm,
            layer: startPoint!.layer,
          },
          {
            route_type: "wire",
            x: endPoint!.x,
            y: endPoint!.y,
            width: traceWidthMm,
            layer: endPoint!.layer,
          },
        ],
      }
    })
  })

test("unbounded reroute replaces imported Circuit JSON traces", async () => {
  const { circuit } = getTestFixture({
    platform: { placementDrcChecksDisabled: true },
  })
  const rerouteSimpleRouteJsonInputs: SimpleRouteJson[] = []

  circuit.add(
    <board width="14mm" height="8mm">
      <subcircuit circuitJson={importedCircuitJson} />
      <autoroutingphase
        reroute
        connections={[]}
        autorouter={{
          algorithmFn: createImportedTraceRerouter(
            rerouteSimpleRouteJsonInputs,
          ),
        }}
      />
      <pcbnotetext text="IMPORTED TRACE REROUTED" pcbX={0} pcbY={3} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(rerouteSimpleRouteJsonInputs).toHaveLength(1)
  expect(rerouteSimpleRouteJsonInputs[0]!.connections).toHaveLength(1)
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.pcb_trace.list()[0]!.route).toHaveLength(3)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
