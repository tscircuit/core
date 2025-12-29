import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<currentsource /> DC and AC", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <currentsource name="IS_DC" current="1A" />
      <resistor name="R1" resistance="1k" schY={-2} />
      <trace from=".IS_DC > .pos" to=".R1 > .pin1" />
      <trace from=".IS_DC > .neg" to=".R1 > .pin2" />

      <currentsource
        name="IS_AC"
        peakToPeakCurrent="2A"
        frequency="1kHz"
        waveShape="sinewave"
        schX={3}
      />
      <resistor name="R2" resistance="1k" schX={3} schY={-2} />
      <trace from=".IS_AC > .pos" to=".R2 > .pin1" />
      <trace from=".IS_AC > .neg" to=".R2 > .pin2" />

      <currentsource
        name="IS_SQUARE"
        peakToPeakCurrent="0.5A"
        frequency="100Hz"
        waveShape="square"
        dutyCycle={0.25}
        schX={6}
      />
      <resistor name="R3" resistance="1k" schX={6} schY={-2} />
      <trace from=".IS_SQUARE > .pos" to=".R3 > .pin1" />
      <trace from=".IS_SQUARE > .neg" to=".R3 > .pin2" />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
