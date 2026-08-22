import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const qfnFootprint =
  "qfn56_w7.8_h7.8_p0.4mm_pw0.23mm_pl0.8mm_thermalpad3.2x3.2" as const

/**
 * A breakout that hugs a fine-pitch QFN cannot fan out: the escapes have no
 * room between the pads and the boundary. The failure should say so, and say
 * what to change, rather than surfacing the solver's bare routed/total count.
 */
test("a breakout with too little room reports how to give the fanout space", async () => {
  const { circuit } = getTestFixture({
    platform: { placementDrcChecksDisabled: true },
  })

  const pins = Array.from({ length: 24 }, (_, index) => index + 1)

  circuit.add(
    <board width="30mm" height="30mm" layers={4}>
      <breakout name="TIGHT" padding="0.05mm">
        <chip name="U1" footprint={qfnFootprint} pcbX={0} pcbY={0} />
      </breakout>
      {pins.map((pin) => (
        <resistor
          key={String(pin)}
          name={`R${pin}`}
          resistance="1k"
          footprint="0402"
          pcbX={-12 + (pin % 12) * 2}
          pcbY={pin < 13 ? 12 : -12}
        />
      ))}
      {pins.map((pin) => (
        <trace
          key={String(pin)}
          name={`T${pin}`}
          from={`.U1 > .pin${pin}`}
          to={`.R${pin} > .pin1`}
        />
      ))}
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const autoroutingErrors = circuitJson.filter(
    (element) => element.type === "pcb_autorouting_error",
  ) as Array<{ message: string }>

  expect(autoroutingErrors.length).toBeGreaterThan(0)
  const message = autoroutingErrors.map((error) => error.message).join("\n")

  // Names the component rather than a pcb_component_id.
  expect(message).toContain("U1")
  // Says what went wrong in board terms.
  expect(message).toContain("escape to the breakout boundary")
  // Says what to do about it -- both remedies.
  expect(message).toContain("padding")
  expect(message).toContain("decoupling capacitors")
  // Does not leak the raw solver phrasing.
  expect(message).not.toContain("best layer assignment")
  // A failed solve must not leave unresolved automatic points at the origin.
  expect(circuit.db.pcb_breakout_point.list()).toEqual([])
})
