import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import external0402Footprint from "tests/fixtures/assets/external-0402-footprint.json"

test("footprint library map circuitjson", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor
        name="R1"
        resistance="10k"
        footprint={external0402Footprint as any}
        pcbX={0}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
