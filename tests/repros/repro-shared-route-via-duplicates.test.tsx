import { expect, test } from "bun:test"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Routes two same-net SRJ connections through one physical plated hole.
 *
 * SRJ and emitted route coordinates are point positions in the right-handed
 * board-world frame, measured in millimeters (+X right, +Y top, +Z above the
 * board). Layers locate points on the Z axis. These are points rather than
 * direction vectors, and no coordinate transform is applied.
 */
async function routeSharedPhysicalViaFixtureSrj(
  fixtureSrj: SimpleRouteJson,
): Promise<SimplifiedPcbTrace[]> {
  return fixtureSrj.connections.map(
    (srjConnection, srjConnectionIndex): SimplifiedPcbTrace => {
      const [startSrjPoint, endSrjPoint] =
        srjConnectionIndex === 0
          ? srjConnection.pointsToConnect
          : [...srjConnection.pointsToConnect].reverse()
      const nominalTraceWidthMm = 0.2
      return {
        type: "pcb_trace",
        pcb_trace_id: `shared_via_route_${srjConnectionIndex}`,
        connection_name: srjConnection.name,
        route: [
          {
            route_type: "wire",
            ...startSrjPoint,
            width: nominalTraceWidthMm,
          },
          {
            route_type: "wire",
            x: 0,
            y: 0,
            layer: startSrjPoint.layer,
            width: nominalTraceWidthMm,
          },
          {
            route_type: "via",
            x: 0,
            y: 0,
            from_layer: startSrjPoint.layer,
            to_layer: endSrjPoint.layer,
          },
          {
            route_type: "wire",
            x: 0,
            y: 0,
            layer: endSrjPoint.layer,
            width: nominalTraceWidthMm,
          },
          {
            route_type: "wire",
            ...endSrjPoint,
            width: nominalTraceWidthMm,
          },
        ],
      }
    },
  )
}

test("same-net routes sharing a via should emit one pcb_via", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width={16}
      height={12}
      minViaHoleDiameter={0.3}
      minViaPadDiameter={0.6}
      autorouter={{
        algorithmFn: createBasicAutorouter(routeSharedPhysicalViaFixtureSrj),
      }}
    >
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-5} />
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
        pcbX={5}
        pcbY={-2}
        layer="bottom"
      />
      <trace from="R1.pin2" to="R2.pin1" />
      <trace from="R1.pin2" to="R3.pin1" />
      <pcbnotetext
        text="Shared via: one physical hole"
        pcbY={4.5}
        fontSize={0.6}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_trace.list()).toHaveLength(2)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit.db.pcb_via.list()).toHaveLength(1)
})
