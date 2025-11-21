import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/*
 * The resistor A should be connect to neart pin 1
 * when 1 2 and 3 are internally connected
 * even when we instruct the trace to connect to pin 3
 */
test("falling internally connected pin", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="40mm">
      <resistor name="A" resistance="1k" footprint="0603" pcbX={-6} pcbY={2} />

      <jumper
        name="J1"
        footprint="pinrow3"
        pinCount={3}
        pcbX={0}
        pcbY={0}
        internallyConnectedPins={[["1", "2", "3"]]}
      />

      <trace from=".A .1" to=".J1 .3" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
