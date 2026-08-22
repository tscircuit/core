import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("bus trace names sharing one connectivity key resolve ambiguously", async () => {
  const { circuit } = getTestFixture()
  let asyncEffectError: string | undefined

  circuit.on("asyncEffect:end", (event) => {
    if (event.error) asyncEffectError = event.error
  })

  circuit.add(
    <board width="20mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-6} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={0} />
      <resistor name="R3" resistance="1k" footprint="0402" pcbX={6} />
      <trace name="LEFT_DATA" from=".R1 > .pin1" to=".R2 > .pin1" />
      <trace name="RIGHT_DATA" from=".R2 > .pin1" to=".R3 > .pin1" />
      <bus name="DATA" connections={["LEFT_DATA", "RIGHT_DATA"]} />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(asyncEffectError).toContain(
    'Bus "DATA" resolves multiple entries to one trace',
  )
})
