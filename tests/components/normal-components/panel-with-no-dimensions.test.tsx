import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import circuitJson from "./assets/simple-circuit.json"

test("panel with no dimensions given", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <panel>
      <board circuitJson={circuitJson as any} />
      <board circuitJson={circuitJson as any} />
    </panel>,
  )

  circuit.render()

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
