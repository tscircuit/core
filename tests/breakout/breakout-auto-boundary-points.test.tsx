import React from "react"
import { expect, test } from "bun:test"
import { su } from "@tscircuit/circuit-json-util"
import type {
  SimpleRouteJson,
  SimplifiedPcbTrace,
} from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("breakout automatically projects referenced qfp pins to the boundary", async () => {
  const { circuit } = getTestFixture()
  const routedInputs: SimpleRouteJson[] = []

  circuit.add(
    <board
      width="22mm"
      height="18mm"
      autorouter={{
        local: true,
        groupMode: "subcircuit",
        algorithmFn: createBasicAutorouter(async (simpleRouteJson) => {
          routedInputs.push(simpleRouteJson)
          return simpleRouteJson.connections.map(
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
        }),
      }}
    >
      <breakout name="B1" padding="2mm">
        <chip
          name="U1"
          footprint="qfp16_w5mm_p0.65mm"
          pcbX={0}
          pcbY={0}
          pinLabels={{
            pin1: "IO1",
            pin2: "IO2",
            pin3: "IO3",
            pin4: "IO4",
            pin5: "IO5",
            pin6: "IO6",
            pin7: "IO7",
            pin8: "IO8",
            pin9: "IO9",
            pin10: "IO10",
            pin11: "IO11",
            pin12: "IO12",
            pin13: "IO13",
            pin14: "IO14",
            pin15: "IO15",
            pin16: "IO16",
          }}
        />
      </breakout>

      <resistor name="RL" resistance="1k" footprint="0402" pcbX={-8} pcbY={0} />
      <resistor name="RR" resistance="1k" footprint="0402" pcbX={8} pcbY={0} />
      <resistor name="RT" resistance="1k" footprint="0402" pcbX={0} pcbY={6} />
      <resistor name="RB" resistance="1k" footprint="0402" pcbX={0} pcbY={-6} />

      <trace from=".U1 > .pin1" to=".RL > .pin1" />
      <trace from=".U1 > .pin5" to=".RT > .pin1" />
      <trace from=".U1 > .pin9" to=".RR > .pin1" />
      <trace from=".U1 > .pin13" to=".RB > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(routedInputs).toHaveLength(1)

  const circuitJson = su(circuit.getCircuitJson())
  const breakoutGroup = circuitJson.pcb_group.getWhere({ name: "B1" })
  expect(breakoutGroup).toBeDefined()

  const breakoutPoints = circuitJson.pcb_breakout_point
    .list()
    .filter((point) => point.pcb_group_id === breakoutGroup!.pcb_group_id)
  expect(breakoutPoints).toHaveLength(4)

  const left = breakoutGroup!.center.x - breakoutGroup!.width! / 2
  const right = breakoutGroup!.center.x + breakoutGroup!.width! / 2
  const bottom = breakoutGroup!.center.y - breakoutGroup!.height! / 2
  const top = breakoutGroup!.center.y + breakoutGroup!.height! / 2

  for (const point of breakoutPoints) {
    const isOnBoundary =
      Math.abs(point.x - left) < 1e-6 ||
      Math.abs(point.x - right) < 1e-6 ||
      Math.abs(point.y - bottom) < 1e-6 ||
      Math.abs(point.y - top) < 1e-6
    expect(isOnBoundary).toBe(true)
  }

  const routedBoundaryPointCount = routedInputs[0].connections.filter(
    (connection) =>
      connection.pointsToConnect.some((point) =>
        breakoutPoints.some(
          (breakoutPoint) =>
            Math.abs(point.x - breakoutPoint.x) < 1e-6 &&
            Math.abs(point.y - breakoutPoint.y) < 1e-6,
        ),
      ),
  ).length
  expect(routedBoundaryPointCount).toBe(4)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
