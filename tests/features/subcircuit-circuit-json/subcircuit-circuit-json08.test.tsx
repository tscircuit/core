import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import subcircuitCircuitJson from "./assets/pic-programmer-circuit-json.json"
import { renderToCircuitJson } from "tests/fixtures/renderToCircuitJson"

test("subcircuit-circuit-json08", async () => {
  const { circuit } = await getTestFixture()
  circuit.add(
    <subcircuit
      name="S1"
      circuitJson={subcircuitCircuitJson}
      pcbX={0}
      pcbY={0}
    />,
  )

  await circuit.renderUntilSettled()

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
}, 25000)
