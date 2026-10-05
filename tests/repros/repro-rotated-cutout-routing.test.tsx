import { expect, test } from "bun:test"
import { getSimpleRouteJsonFromCircuitJson } from "lib/utils/autorouting/getSimpleRouteJsonFromCircuitJson"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("routing obstacles preserve a rectangular cutout's rotation", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={8} schAutoLayoutEnabled autorouter="auto-local">
      <pinheader name="J1" pinCount={1} pcbX={-4} pcbY={1.3} />
      <pinheader name="J2" pinCount={1} pcbX={4} pcbY={1.3} />
      <cutout shape="rect" width={4} height={1} pcbRotation={45} />
      <trace from=".J1 > .pin1" to=".J2 > .pin1" />
      <pcbnotetext
        text="Copper must avoid the diagonal opening"
        pcbY={-3}
        fontSize={0.4}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showPcbNotes: true,
  })

  const cutout = circuit.db.pcb_cutout.list()[0]!
  expect(cutout.shape).toBe("rect")
  const { simpleRouteJson } = getSimpleRouteJsonFromCircuitJson({
    db: circuit.db,
  })
  const obstacle = simpleRouteJson.obstacles.find(
    ({ center }) =>
      center.x === cutout.center.x && center.y === cutout.center.y,
  )!
  expect(obstacle.layers).toEqual(["top", "bottom"])
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.pcb_autorouting_error.list()).toHaveLength(0)
  expect(circuit.db.source_trace_not_connected_error.list()).toHaveLength(0)
  expect(obstacle.ccwRotationDegrees).toBeCloseTo(45)
})
