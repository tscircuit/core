import { expect, test } from "bun:test"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// U1.pin15 is an inner ball of a 6x6, 0.8mm-pitch BGA at (-0.4, -0.4)
const PAD_CENTER = { x: -0.4, y: -0.4 }

test("a via in a BGA pad does not overlap its pad obstacle", async () => {
  const { circuit } = getTestFixture()
  let autorouterInput: SimpleRouteJson | undefined
  circuit.on("autorouting:start", (event: any) => {
    autorouterInput = structuredClone(event.simpleRouteJson)
  })

  circuit.add(
    <board
      width="20mm"
      height="20mm"
      layers={4}
      isViaInPadAllowed
      minViaHoleDiameter={0.15}
      minViaPadDiameter={0.3}
      pcbStyle={{ viaHoleDiameter: 0.15, viaPadDiameter: 0.3 }}
    >
      <chip
        name="U1"
        footprint="bga36_grid6x6_p0.8_ball0.4_pad0.4"
        pcbX={0}
        pcbY={0}
      />
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={7} pcbY={0} />
      <trace from=".U1 > .pin15" to=".R1 > .pin1" />
      <via
        name="VIP"
        pcbX={PAD_CENTER.x}
        pcbY={PAD_CENTER.y}
        holeDiameter={0.15}
        outerDiameter={0.3}
        fromLayer="top"
        toLayer="bottom"
        connectsTo=".U1 > .pin15"
      />
    </board>,
  )
  await circuit.renderUntilSettled()

  const obstaclesAtPad = autorouterInput!.obstacles.filter(
    (obstacle) =>
      Math.hypot(
        obstacle.center.x - PAD_CENTER.x,
        obstacle.center.y - PAD_CENTER.y,
      ) < 1e-6,
  )
  const padObstacle = obstaclesAtPad.find(
    (obstacle) => obstacle.circuitJsonMetadata?.pcb_smtpad_id,
  )
  const viaObstacle = obstaclesAtPad.find(
    (obstacle) => obstacle.circuitJsonMetadata?.pcb_via_id,
  )
  // The pad and its via must not overlap on a shared layer
  expect(padObstacle?.layers).toEqual(["top"])
  expect(viaObstacle?.layers).toEqual(["inner1", "inner2", "bottom"])

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
