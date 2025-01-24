import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("<pushbutton /> component 2 - multiple push buttons", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="30mm" height="10mm">
      <pushbutton name="SW1" footprint="soic4" pcbX={-8} schX={-3} />
      <pushbutton name="SW2" footprint="soic4" pcbX={8} schX={3} />
      <trace from=".SW1 .side1" to=".SW2 .side2" />
    </board>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
  expect(circuit).toMatchSchematicSnapshot(import.meta.path)
})
