import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Debug from "debug"
import { ArduinoShield } from "@tscircuit/common"

test("arduino shield components packed outside board", async () => {
  // Enable debug logging for pack input
  // Debug.enable("Group_doInitialPcbLayoutPack")

  const { circuit } = getTestFixture()

  circuit.add(
    // @ts-expect-error bug in arduino shield where we can't specify name
    <ArduinoShield>
      <resistor name="R1" resistance="10k" footprint="0805" />
      <led name="LED1" color="red" footprint="0603" />
      <trace from=".R1 > .pin1" to=".LED1 > .pin1" />
      <trace from=".R1 > .pin2" to=".LED1 > .pin2" />
    </ArduinoShield>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
