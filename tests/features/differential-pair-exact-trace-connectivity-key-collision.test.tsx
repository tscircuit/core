import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("differential pair trace name sharing a connectivity key resolves ambiguously", async () => {
  const { circuit } = getTestFixture()
  let asyncEffectError: string | undefined

  circuit.on("asyncEffect:end", (event) => {
    if (event.error) asyncEffectError = event.error
  })

  circuit.add(
    <board width="24mm" height="14mm">
      <resistor name="P1" resistance="1k" footprint="0402" pcbX={-8} pcbY={2} />
      <resistor name="P2" resistance="1k" footprint="0402" pcbX={0} pcbY={2} />
      <resistor name="P3" resistance="1k" footprint="0402" pcbX={8} pcbY={2} />
      <resistor
        name="N1"
        resistance="1k"
        footprint="0402"
        pcbX={-8}
        pcbY={-2}
      />
      <resistor name="N2" resistance="1k" footprint="0402" pcbX={0} pcbY={-2} />
      <trace name="USB_P" from=".P1 > .pin1" to=".P2 > .pin1" />
      <trace name="USB_P_TAP" from=".P2 > .pin1" to=".P3 > .pin1" />
      <trace name="USB_N" from=".N1 > .pin1" to=".N2 > .pin1" />
      <differentialpair
        name="USB"
        positiveConnection="USB_P"
        negativeConnection="USB_N"
        maxLengthSkew={0.1}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(asyncEffectError).toContain(
    'matches multiple SRJ connections for differential pair "USB"',
  )
})
