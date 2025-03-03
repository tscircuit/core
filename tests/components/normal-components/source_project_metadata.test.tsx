import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { su } from "@tscircuit/soup-util"

test("source_project_metadata added to circuit JSON output", async () => {
  const { circuit } = await getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <resistor resistance="1k" footprint="0402" name="R1" schX={3} pcbX={3} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const sourceProjectMetadata = su(circuitJson).source_project_metadata.list()

  // Ensure that source_project_metadata is added
  expect(sourceProjectMetadata.length).toBeGreaterThan(0)
})
