import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { su } from "@tscircuit/soup-util"

test("source_project_metadata added to circuit JSON output", async () => {
  const { circuit } = await getTestFixture()

  circuit.add(
    <board width="10mm" height="10mm">
      <subcircuit name="S1">
        <resistor
          resistance="1k"
          footprint="0402"
          name="R1"
          schX={3}
          pcbX={3}
        />
        <resistor
          resistance="1k"
          footprint="0402"
          name="R2"
          schX={3}
          pcbX={3}
          pcbY={2}
        />
        <trace from=".R1 .pin1" to=".R2 .pin2" />
      </subcircuit>
      <subcircuit name="S2">
        <capacitor
          capacitance="1000pF"
          footprint="0603"
          name="C1"
          schX={-3}
          pcbX={-3}
        />
        <trace from=".C1 .pin1" to=".C1 .pin2" />
      </subcircuit>
      <trace from=".S1 .R1 > .pin1" to=".S2 .C1 > .pin1" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const sourceProjectMetadata = su(circuitJson).source_project_metadata.list()

  // Ensure that source_project_metadata is added
  expect(sourceProjectMetadata.length).toBeGreaterThan(0)
})
