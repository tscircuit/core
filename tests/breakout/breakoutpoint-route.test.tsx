import React from "react"
import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { su } from "@tscircuit/circuit-json-util"
import { getRoutePointPositions } from "lib/utils/pcb-trace-route-point-utils"

test("breakout point is projected to boundary", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="20mm">
      <breakout name="B1">
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
        <capacitor
          name="C1"
          capacitance="1uF"
          footprint="0402"
          pcbX={2}
          pcbY={0}
        />
        <breakoutpoint connection="R1.1" pcbX={2} pcbY={2} />
      </breakout>
      <trace from="R1.2" to="C1.1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = su(circuit.getCircuitJson())
  const breakoutGroup = circuitJson.pcb_group.getWhere({ name: "B1" })!
  const breakoutPoint = circuitJson.pcb_breakout_point.list()[0]
  const left = breakoutGroup.center.x - breakoutGroup.width! / 2
  const right = breakoutGroup.center.x + breakoutGroup.width! / 2
  const bottom = breakoutGroup.center.y - breakoutGroup.height! / 2
  const top = breakoutGroup.center.y + breakoutGroup.height! / 2
  const isOnBoundary =
    Math.abs(breakoutPoint.x - left) < 1e-6 ||
    Math.abs(breakoutPoint.x - right) < 1e-6 ||
    Math.abs(breakoutPoint.y - bottom) < 1e-6 ||
    Math.abs(breakoutPoint.y - top) < 1e-6
  expect(isOnBoundary).toBe(true)

  const pcb_trace = circuitJson.pcb_trace.list()
  const hasPointNear = pcb_trace.some((t) =>
    t.route.some((pt) =>
      getRoutePointPositions(pt).some(
        (position) =>
          Math.abs(position.x - breakoutPoint.x) < 0.6 &&
          Math.abs(position.y - breakoutPoint.y) < 0.6,
      ),
    ),
  )
  expect(hasPointNear).toBe(true)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
