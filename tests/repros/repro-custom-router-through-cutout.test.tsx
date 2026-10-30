import { expect, test } from "bun:test"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("custom algorithmFn copper crossing a cutout produces a routing DRC error", async () => {
  const { circuit } = getTestFixture()
  let receivedCutoutObstacle = false
  circuit.add(
    <board
      width={10}
      height={6}
      layers={4}
      schematicDisabled
      autorouter={{
        local: true,
        groupMode: "subcircuit",
        algorithmFn: createBasicAutorouter(async (simpleRouteJson) => {
          receivedCutoutObstacle = simpleRouteJson.obstacles.some(
            (obstacle) =>
              Math.abs(obstacle.center.x) < 1e-6 &&
              Math.abs(obstacle.center.y) < 1e-6 &&
              Math.abs(obstacle.width - 1.51) < 1e-6 &&
              Math.abs(obstacle.height - 0.71) < 1e-6,
          )
          const connection = simpleRouteJson.connections[0]
          const [start, end] = connection.pointsToConnect
          // Reproduce a hand-edited result returned by algorithmFn. The slot
          // is in its input obstacles, but the returned copper ignores it.
          return [
            {
              type: "pcb_trace",
              pcb_trace_id: "manual_replacement",
              connection_name: connection.name,
              route: [
                { route_type: "wire", ...start, width: 0.56 },
                { route_type: "wire", x: 0, y: 0, layer: "top", width: 0.56 },
                { route_type: "wire", ...end, width: 0.56 },
              ],
            },
          ]
        }),
      }}
    >
      <pinheader name="J1" pinCount={1} pcbX={-3} />
      <pinheader name="J2" pinCount={1} pcbX={3} />
      <trace
        name="VM_TO_ADC_DIVIDER"
        from=".J1 > .pin1"
        to=".J2 > .pin1"
        thickness={0.56}
      />
      <cutout name="USB_POST_SLOT" shape="rect" width={1.51} height={0.71} />
      <pcbnotetext
        text="Custom router ignores slot: DRC must report it"
        pcbY={2}
        fontSize={0.25}
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  expect(receivedCutoutObstacle).toBe(true)
  const trace = circuit.db.pcb_trace.list()[0]
  expect(
    trace.route.some(
      (point) => point.route_type === "wire" && point.x === 0 && point.y === 0,
    ),
  ).toBe(true)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
  const errors = circuit
    .getCircuitJson()
    .filter((element) => element.type.endsWith("_error"))
  expect(errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        message: expect.stringMatching(/cutout|slot/i),
      }),
    ]),
  )
})
