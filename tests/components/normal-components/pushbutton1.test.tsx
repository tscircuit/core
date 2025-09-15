import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import Board from '../../lib/components/board';
import PushButton from '../../lib/components/pushbutton';

test("<pushbutton /> component", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <Board width={12} height={10}>
      <Pushbutton
        name="PB1"
        footprint="PUSHBUTTON_THT"
        pcbX={0}
        pcbY={0}
        pin1="GND"
        pin2="VCC"
      />
    </Board>,
  )

  await circuit.renderUntilSettled()
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
