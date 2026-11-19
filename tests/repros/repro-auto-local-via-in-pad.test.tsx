import { expect, test } from "bun:test"
import { checkViasInPads } from "@tscircuit/checks"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("auto_local drops an explicit via-in-pad prohibition", async () => {
  const { circuit } = getTestFixture()
  let allowViaInPad: boolean | undefined
  circuit.on("autorouting:start", ({ simpleRouteJson }) => {
    allowViaInPad = simpleRouteJson.allowViaInPad
  })

  circuit.add(
    <board
      width={8}
      height={8}
      layers={2}
      isViaInPadAllowed
      minTraceWidth={0.1}
      minTraceToPadEdgeClearance={0.06}
      minViaPadDiameter={0.4}
      minViaHoleDiameter={0.2}
      minViaEdgeToPadEdgeClearance={0.06}
      autorouter={{ preset: "auto_local", allowViaInPad: false }}
      autorouterVersion="beta_pipeline9"
      routeRemaining={false}
    >
      <chip name="U1" footprint="bga16_grid4x4_p0.8_ball0.6_pad0.6" />
      <testpoint
        name="TP1"
        footprintVariant="pad"
        layer="bottom"
        padDiameter={1}
        pcbX={-0.1}
        pcbY={-0.4}
      />
      <autoroutingphase phaseIndex={1} />
      <trace from="U1.pin6" to="TP1.pin1" routingPhaseIndex={1} />
    </board>,
  )
  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(allowViaInPad).toBe(true)
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.pcb_via.list()).toHaveLength(1)

  // Check the emitted copper against the explicit routing policy.
  const strictCircuit = circuit.getCircuitJson().map((element) => {
    if (element.type === "pcb_board") {
      return { ...element, is_via_in_pad_allowed: false }
    }
    return element
  })
  expect(checkViasInPads(strictCircuit)).toHaveLength(2)

  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
