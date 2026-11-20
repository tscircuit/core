import { expect, test } from "bun:test"
import { computeLocalSkew } from "lib/utils/local-skew/compute-local-skew"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { formatKnotPoints } from "tests/fixtures/local-skew/get-knot-points"

const TRACE_WIDTH = 0.15

/** Routes each connection straight, dropping DP through the assignable via V1 at x = -4. */
const algorithmFn = createBasicAutorouter(async (input) =>
  input.connections.map((connection): SimplifiedPcbTrace => {
    const [start, end] = connection.pointsToConnect
    const via = input.obstacles.find((obstacle) => obstacle.netIsAssignable)
    const route: SimplifiedPcbTrace["route"] = [
      { ...start, route_type: "wire", width: TRACE_WIDTH },
    ]
    if (start.layer !== end.layer && via) {
      const crossing = { x: -4, y: start.y }
      route.push(
        { ...crossing, route_type: "wire", layer: "top", width: TRACE_WIDTH },
        {
          route_type: "through_obstacle",
          start: crossing,
          end: crossing,
          from_layer: "top",
          to_layer: "bottom",
          width: TRACE_WIDTH,
          circuitJsonMetadata: via.circuitJsonMetadata,
        },
        {
          ...crossing,
          route_type: "wire",
          layer: "bottom",
          width: TRACE_WIDTH,
        },
      )
    }
    route.push({ ...end, route_type: "wire", width: TRACE_WIDTH })
    return {
      type: "pcb_trace",
      pcb_trace_id: connection.name,
      connection_name: connection.name,
      route,
    }
  }),
)

test("a claimed through-pad via adds the same layer distance as a routed via", async () => {
  const { circuit } = getTestFixture({ platform: { drcChecksDisabled: true } })
  circuit.add(
    <board width={22} height={8} thickness={1.6} autorouter={{ algorithmFn }}>
      <testpoint
        name="P1"
        footprintVariant="pad"
        doNotPlace
        pcbX={-9}
        pcbY={0.4}
      />
      <testpoint
        name="P2"
        footprintVariant="pad"
        doNotPlace
        pcbX={9}
        pcbY={0.4}
        layer="bottom"
      />
      <testpoint
        name="N1"
        footprintVariant="pad"
        doNotPlace
        pcbX={-9}
        pcbY={-0.4}
        layer="bottom"
      />
      <testpoint
        name="N2"
        footprintVariant="pad"
        doNotPlace
        pcbX={9}
        pcbY={-0.4}
        layer="bottom"
      />
      <via
        name="V1"
        pcbX={-4}
        pcbY={0.4}
        fromLayer="top"
        toLayer="bottom"
        holeDiameter={0.2}
        outerDiameter={0.4}
        netIsAssignable
      />
      <trace name="DP" from="P1.1" to="P2.1" thickness={TRACE_WIDTH} />
      <trace name="DN" from="N1.1" to="N2.1" thickness={TRACE_WIDTH} />
      <differentialpair
        name="PAIR"
        positiveConnection="DP"
        negativeConnection="DN"
        pcbTraceGap={0.65}
      />
      <pcbnotetext
        pcbY={1.2}
        fontSize={0.35}
        text="DP changes layers through the claimed via V1 at x = -4 mm. DN stays on bottom."
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)

  const circuitJson = circuit.getCircuitJson()
  const [localSkew] = computeLocalSkew({ circuitJson }).localSkews
  const positiveTrace = circuit.db.pcb_trace.get(
    localSkew.walks.positive[0].pcb_trace_id,
  )
  expect(positiveTrace?.route).toContainEqual(
    expect.objectContaining({
      route_type: "through_pad",
      start_layer: "top",
      end_layer: "bottom",
    }),
  )
  expect(formatKnotPoints({ circuitJson, localSkew })).toMatchInlineSnapshot(`
    "P -4,0.4  N -4,-0.4  skew 0
    P -4,0.4  N -4,-0.4  skew 1.6
    P 9,0.4  N 9,-0.4  skew 1.6"
  `)
})
