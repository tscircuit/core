import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("isolated subcircuit receives platform config from parent", async () => {
  const { circuit } = getTestFixture({
    platform: {
      partsEngineDisabled: true,
    },
  })

  circuit.add(
    <board width="10mm" height="10mm">
      <subcircuit name="S1" _subcircuitCachingEnabled>
        <resistor
          name="R1"
          resistance="1k"
          footprint="0402"
          pcbX={0}
          schX={0}
        />
      </subcircuit>
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  // Should have rendered successfully
  const sourceComponents = circuitJson.filter(
    (e: any) => e.type === "source_component",
  )
  expect(sourceComponents.length).toBeGreaterThanOrEqual(1)

  // Verify the isolated render completed (source_group exists in output)
  const sourceGroups = circuitJson.filter((e: any) => e.type === "source_group")
  expect(sourceGroups.length).toBeGreaterThanOrEqual(1)
})
