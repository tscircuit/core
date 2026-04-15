import { expect, test } from "bun:test"
import type { ChipProps } from "@tscircuit/props"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"

const pinLabels = {
  pin1: ["BAT_POS"],
  pin2: ["BAT_NEG"],
} as const

const pinAttributes = {
  pin1: { mustBeConnected: true },
  BAT_POS: { mustBeConnected: true },
  pin2: { mustBeConnected: true },
  BAT_NEG: { mustBeConnected: true },
} as any

function BatteryClipUsingViaConnectsTo(props: ChipProps<typeof pinLabels>) {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-8.5mm"
            pcbY="0mm"
            width="5mm"
            height="3.5mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="8.5mm"
            pcbY="0mm"
            width="5mm"
            height="5.5mm"
            shape="rect"
          />
          <via
            pcbX="-8mm"
            pcbY="0mm"
            outerDiameter="1.85mm"
            holeDiameter="0.925mm"
            fromLayer="top"
            toLayer="bottom"
            connectsTo="pin1"
          />
          <via
            pcbX="8mm"
            pcbY="0mm"
            outerDiameter="1.85mm"
            holeDiameter="0.925mm"
            fromLayer="top"
            toLayer="bottom"
            connectsTo="pin2"
          />
        </footprint>
      }
      {...props}
    />
  )
}

function BatteryClipUsingPlatedHolePortHints(
  props: ChipProps<typeof pinLabels>,
) {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      footprint={
        <footprint>
          <smtpad
            portHints={["pin1"]}
            pcbX="-8.5mm"
            pcbY="0mm"
            width="5mm"
            height="3.5mm"
            shape="rect"
          />
          <smtpad
            portHints={["pin2"]}
            pcbX="8.5mm"
            pcbY="0mm"
            width="5mm"
            height="5.5mm"
            shape="rect"
          />
          <platedhole
            portHints={["pin1"]}
            pcbX="-8mm"
            pcbY="0mm"
            outerDiameter="1.85mm"
            holeDiameter="0.925mm"
            shape="circle"
          />
          <platedhole
            portHints={["pin2"]}
            pcbX="8mm"
            pcbY="0mm"
            outerDiameter="1.85mm"
            holeDiameter="0.925mm"
            shape="circle"
          />
        </footprint>
      }
      {...props}
    />
  )
}

const findObstacleAtCenter = (
  obstacles: Array<{
    center: { x: number; y: number }
    connectedTo: string[]
    width: number
    height: number
  }>,
  center: { x: number; y: number },
) =>
  obstacles.find(
    (obstacle) =>
      Math.abs(obstacle.center.x - center.x) < 0.001 &&
      Math.abs(obstacle.center.y - center.y) < 0.001,
  )

test("repro109: vias with connectsTo should contribute obstacle connectivity like plated holes", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="130mm" height="40mm" layers={2}>
      <BatteryClipUsingViaConnectsTo name="J_VIA" pcbX={-35} pcbY={0} />
      <BatteryClipUsingPlatedHolePortHints name="J_PH" pcbX={35} pcbY={0} />

      <resistor
        name="R_VIA_POS"
        resistance="10k"
        footprint="0603"
        pcbX={-10}
        pcbY={-7}
        pcbRotation={90}
      />
      <resistor
        name="R_VIA_NEG"
        resistance="10k"
        footprint="0603"
        pcbX={-10}
        pcbY={7}
        pcbRotation={90}
      />

      <resistor
        name="R_PH_POS"
        resistance="10k"
        footprint="0603"
        pcbX={60}
        pcbY={-7}
        pcbRotation={90}
      />
      <resistor
        name="R_PH_NEG"
        resistance="10k"
        footprint="0603"
        pcbX={60}
        pcbY={7}
        pcbRotation={90}
      />

      <trace from="J_VIA.BAT_POS" to="R_VIA_POS.pin1" />
      <trace from="J_VIA.BAT_NEG" to="R_VIA_NEG.pin1" />
      <trace from="R_VIA_POS.pin2" to="net.VIA_LOAD" />
      <trace from="R_VIA_NEG.pin2" to="net.VIA_LOAD" />

      <trace from="J_PH.BAT_POS" to="R_PH_POS.pin1" />
      <trace from="J_PH.BAT_NEG" to="R_PH_NEG.pin1" />
      <trace from="R_PH_POS.pin2" to="net.PH_LOAD" />
      <trace from="R_PH_NEG.pin2" to="net.PH_LOAD" />
    </board>,
  )
  await circuit.renderUntilSettled()

  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    circuitJson: circuit.getCircuitJson(),
  })

  const viaObstacles = circuit.db.pcb_via.list().map((via) => ({
    pcb_via_id: via.pcb_via_id,
    center: { x: via.x, y: via.y },
    obstacle: findObstacleAtCenter(simpleRouteJson.obstacles, {
      x: via.x,
      y: via.y,
    }),
  }))

  const platedHoleObstacles = circuit.db.pcb_plated_hole.list().map((hole) => ({
    pcb_plated_hole_id: hole.pcb_plated_hole_id,
    center: { x: hole.x, y: hole.y },
    obstacle: findObstacleAtCenter(simpleRouteJson.obstacles, {
      x: hole.x,
      y: hole.y,
    }),
  }))

  console.log(
    JSON.stringify(
      {
        via_obstacles: viaObstacles,
        plated_hole_obstacles: platedHoleObstacles,
      },
      null,
      2,
    ),
  )

  expect(platedHoleObstacles.every((entry) => entry.obstacle)).toBe(true)
  expect(
    platedHoleObstacles.every(
      (entry) => (entry.obstacle?.connectedTo.length ?? 0) > 0,
    ),
  ).toBe(true)

  expect(viaObstacles.every((entry) => entry.obstacle)).toBe(true)
  expect(
    viaObstacles.every(
      (entry) => (entry.obstacle?.connectedTo.length ?? 0) > 0,
    ),
  ).toBe(true)
})
