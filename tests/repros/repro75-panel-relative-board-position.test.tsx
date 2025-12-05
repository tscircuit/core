import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("boards inside panel have positions relative to panel", async () => {
  const { circuit } = getTestFixture()

  // Panel at (50, 50) with two boards at relative positions
  // Board 1 at relative (10, 10) -> absolute (60, 60)
  // Board 2 at relative (-10, -10) -> absolute (40, 40)
  circuit.add(
    <panel width={50} height={50} pcbX="50mm" pcbY="50mm">
      <board width="10mm" height="10mm" routingDisabled pcbX={10} pcbY={10}>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
        <resistor
          name="R2"
          resistance="1k"
          footprint="0402"
          pcbX={2}
          pcbY={0}
        />
      </board>
      <board width="10mm" height="10mm" routingDisabled pcbX={-10} pcbY={-10}>
        <resistor
          name="R3"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          pcbY={0}
        />
      </board>
    </panel>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
