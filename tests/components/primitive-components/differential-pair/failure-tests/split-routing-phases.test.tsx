import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("reports when differential pair traces use different routing phases", async (): Promise<void> => {
  const { circuit } = getTestFixture()
  let asyncEffectError: string | undefined

  circuit.on("asyncEffect:end", (event) => {
    if (event.error) asyncEffectError = event.error
  })

  circuit.add(
    <board width="20mm" height="20mm">
      <chip name="U1" footprint="soic8" pcbX={-5} />
      <chip name="U2" footprint="soic8" pcbX={5} />
      <differentialpair
        name="USB"
        positiveConnection="USB_P"
        negativeConnection="USB_N"
        maxLengthSkew={0.05}
      />
      <trace
        name="USB_P"
        from=".U1 > .pin1"
        to=".U2 > .pin1"
        routingPhaseIndex={0}
      />
      <trace
        name="USB_N"
        from=".U1 > .pin2"
        to=".U2 > .pin6"
        routingPhaseIndex={1}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(asyncEffectError).toContain(
    "cannot be split across autorouting phases",
  )
})
