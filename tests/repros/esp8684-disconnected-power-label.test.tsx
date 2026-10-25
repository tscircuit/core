import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Board from "./esp8684-motion-board"

// The other sections are required: the isolated MCU section does not reproduce the gap.
test("ESP8684 V3V3 label disconnects from the MCU power bus", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(<Board />)
  await circuit.renderUntilSettled()
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
