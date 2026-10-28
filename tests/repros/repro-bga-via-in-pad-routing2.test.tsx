import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// U1.pin15 is an inner ball of a 6x6, 0.8mm-pitch BGA at (-0.4, -0.4). Its
// 0.6mm pads leave no room for a trace between balls on the top layer.
const PAD_CENTER = { x: -0.4, y: -0.4 }

test("a BGA ball escapes through the via drilled into its pad", async () => {
  const { circuit } = getTestFixture()

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
        footprint="bga36_grid6x6_p0.8_ball0.6_pad0.6"
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

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  const [trace] = circuit.db.pcb_trace.list()
  expect(trace).toBeDefined()

  // The route leaves the pad on an inner layer without adding a second via
  // on top of the one already drilled into the pad
  const firstWireOffPad = trace.route.find(
    (point) =>
      point.route_type === "wire" &&
      Math.hypot(point.x - PAD_CENTER.x, point.y - PAD_CENTER.y) > 1e-6,
  )
  expect(
    firstWireOffPad?.route_type === "wire" && firstWireOffPad.layer,
  ).not.toBe("top")
  const viasAtPad = circuit.db.pcb_via
    .list()
    .filter(
      (via) => Math.hypot(via.x - PAD_CENTER.x, via.y - PAD_CENTER.y) < 1e-6,
    )
  expect(viasAtPad).toHaveLength(1)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
