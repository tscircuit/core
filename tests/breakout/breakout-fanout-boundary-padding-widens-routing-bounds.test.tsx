import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const qfnFootprint =
  "qfn56_w7.8_h7.8_p0.4mm_pw0.23mm_pl0.8mm_thermalpad3.2x3.2" as const

/**
 * `fanoutBoundaryPadding` moves the boundary the fanout terminates on. The
 * routing area has to follow it, otherwise every exit sits outside the region
 * copper may occupy and the fanout is rejected wholesale.
 */
test("fanoutBoundaryPadding does not push the fanout boundary outside the routing area", async () => {
  const { circuit } = getTestFixture({
    platform: { placementDrcChecksDisabled: true },
  })

  circuit.add(
    <board width="30mm" height="30mm" layers={4}>
      <breakout name="ESCAPE" fanoutBoundaryPadding="1.2mm">
        <chip name="U1" footprint={qfnFootprint} pcbX={0} pcbY={0} />
      </breakout>
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={10} pcbY={0} />
      <resistor
        name="R2"
        resistance="1k"
        footprint="0402"
        pcbX={-10}
        pcbY={0}
      />
      <trace name="T1" from=".U1 > .pin1" to=".R1 > .pin1" />
      <trace name="T2" from=".U1 > .pin15" to=".R2 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const autoroutingErrors = circuit
    .getCircuitJson()
    .filter((element) => element.type === "pcb_autorouting_error") as Array<{
    message: string
  }>

  // The guard fires when the boundary escapes the routable area; keeping the
  // two consistent means it never should.
  expect(
    autoroutingErrors.filter((error) =>
      error.message.includes("outside the routable area"),
    ),
  ).toHaveLength(0)
}, 60_000)
